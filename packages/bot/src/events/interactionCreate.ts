import {
    Events,
    EmbedBuilder,
    Colors,
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
} from 'discord.js';
import { createEvent } from '../types/Event.js';
import { configCache } from '../lib/cache.js';
import {
    handleCommandError,
    PermissionError,
    CooldownError,
    FeatureDisabledError,
} from '../lib/errors.js';
import { NovaClient } from '../client.js';

// Button interaction handler
async function handleButtonInteraction(interaction: ButtonInteraction, client: NovaClient) {
    const [action, ...args] = interaction.customId.split(':');

    try {
        switch (action) {
            case 'help_category': {
                const category = args[0];
                const commands = Array.from(client.commands.values())
                    .filter((cmd) => cmd.options.category === category)
                    .map((cmd) => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
                    .join('\n');

                const categoryEmojis: Record<string, string> = {
                    mod: '🛡️',
                    admin: '⚙️',
                    utility: '🔧',
                    roles: '👥',
                };

                const embed = new EmbedBuilder()
                    .setColor(Colors.Blurple)
                    .setTitle(`${categoryEmojis[category] || '📁'} ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
                    .setDescription(commands || 'No commands in this category.')
                    .setFooter({ text: 'Use /help <command> for detailed info' });

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'help_back': {
                // Return to main help menu
                await interaction.reply({
                    content: 'Use `/help` to see the main menu again.',
                    ephemeral: true,
                });
                break;
            }

            case 'confirm_action': {
                const actionType = args[0];
                await interaction.reply({
                    content: `✅ Action "${actionType}" confirmed!`,
                    ephemeral: true,
                });
                break;
            }

            case 'cancel_action': {
                await interaction.reply({
                    content: '❌ Action cancelled.',
                    ephemeral: true,
                });
                break;
            }

            default:
                console.warn(`Unknown button interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: 'This button is not recognized.',
                    ephemeral: true,
                });
        }
    } catch (error) {
        console.error('Button interaction error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'An error occurred while processing this button.',
                ephemeral: true,
            });
        }
    }
}

// Select menu interaction handler
async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction, client: NovaClient) {
    const [action] = interaction.customId.split(':');
    const selected = interaction.values[0];

    try {
        switch (action) {
            case 'help_select': {
                const command = client.commands.get(selected);

                if (!command) {
                    await interaction.reply({
                        content: `Command \`${selected}\` not found.`,
                        ephemeral: true,
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(Colors.Blurple)
                    .setTitle(`/${command.data.name}`)
                    .setDescription(command.data.description)
                    .addFields(
                        { name: 'Category', value: command.options.category, inline: true },
                        {
                            name: 'Cooldown',
                            value: command.options.cooldown ? `${command.options.cooldown}s` : 'None',
                            inline: true,
                        }
                    );

                if (command.options.modOnly) {
                    embed.addFields({ name: 'Requires', value: 'Moderator role', inline: true });
                }

                if (command.options.adminOnly) {
                    embed.addFields({ name: 'Requires', value: 'Administrator role', inline: true });
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            default:
                console.warn(`Unknown select menu: ${interaction.customId}`);
                await interaction.reply({
                    content: 'This menu is not recognized.',
                    ephemeral: true,
                });
        }
    } catch (error) {
        console.error('Select menu interaction error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'An error occurred while processing this menu.',
                ephemeral: true,
            });
        }
    }
}

// Modal submission handler
async function handleModalSubmit(interaction: ModalSubmitInteraction, _client: NovaClient) {
    const [action] = interaction.customId.split(':');

    try {
        switch (action) {
            case 'feedback': {
                const feedbackText = interaction.fields.getTextInputValue('feedback_input');
                const feedbackType = interaction.fields.getTextInputValue('feedback_type') || 'General';

                console.log(`[Feedback] From ${interaction.user.tag}: [${feedbackType}] ${feedbackText}`);

                const embed = new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('✅ Feedback Received!')
                    .setDescription('Thank you for your feedback. It helps us improve the bot!')
                    .addFields(
                        { name: 'Type', value: feedbackType, inline: true },
                        { name: 'Your Feedback', value: feedbackText.slice(0, 1024) }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'report': {
                const reportReason = interaction.fields.getTextInputValue('report_reason');
                const reportDetails = interaction.fields.getTextInputValue('report_details');

                console.log(`[Report] From ${interaction.user.tag} in ${interaction.guildId}: ${reportReason} - ${reportDetails}`);

                await interaction.reply({
                    content: '✅ Your report has been submitted. A moderator will review it.',
                    ephemeral: true,
                });
                break;
            }

            default:
                console.warn(`Unknown modal: ${interaction.customId}`);
                await interaction.reply({
                    content: 'This form submission is not recognized.',
                    ephemeral: true,
                });
        }
    } catch (error) {
        console.error('Modal submission error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'An error occurred while processing this form.',
                ephemeral: true,
            });
        }
    }
}

export default createEvent(Events.InteractionCreate, async (client, interaction) => {
    // Handle button interactions
    if (interaction.isButton()) {
        await handleButtonInteraction(interaction, client);
        return;
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction, client);
        return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction, client);
        return;
    }

    // Only handle chat input commands from here
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn(`Unknown command: ${interaction.commandName}`);
        return;
    }

    // Must be in a guild
    if (!interaction.guildId || !interaction.guild) {
        await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true,
        });
        return;
    }

    const guildId = interaction.guildId;
    const member = interaction.member;

    try {
        // Check if command/category is enabled
        const isEnabled = await configCache.isCommandEnabled(
            guildId,
            command.options.name,
            command.options.category
        );

        if (!isEnabled) {
            throw new FeatureDisabledError(command.options.category);
        }

        // Check role-based permissions from config
        if (member && 'roles' in member) {
            // Normalize roles to string array (handle both APIInteractionGuildMember and GuildMember)
            const userRoles = Array.isArray(member.roles)
                ? member.roles
                : member.roles.cache.map((r) => r.id);

            // Check if user is the server owner (they bypass all permission checks)
            const isOwner = interaction.guild.ownerId === interaction.user.id;

            // Check if user has Administrator permission
            const hasAdminPerm =
                'permissions' in member &&
                typeof member.permissions !== 'string' &&
                member.permissions.has('Administrator');

            // Check mod-only commands
            if (command.options.modOnly) {
                const isMod = await configCache.isModerator(guildId, userRoles);
                if (!isOwner && !hasAdminPerm && !isMod) {
                    throw new PermissionError('You must be a moderator to use this command.');
                }
            }

            // Check admin-only commands
            if (command.options.adminOnly) {
                const isAdmin = await configCache.isAdmin(guildId, userRoles);
                if (!isOwner && !hasAdminPerm && !isAdmin) {
                    throw new PermissionError('You must be an administrator to use this command.');
                }
            }

            // Check custom command permissions (owners and admins bypass this too)
            if (!isOwner && !hasAdminPerm) {
                const hasPermission = await configCache.hasCommandPermission(
                    guildId,
                    command.options.name,
                    userRoles
                );
                if (!hasPermission) {
                    throw new PermissionError();
                }
            }
        }

        // Check cooldown
        const cooldownSeconds =
            (await configCache.getCooldown(guildId, command.options.name)) ||
            command.options.cooldown ||
            0;

        if (cooldownSeconds > 0) {
            const remaining = client.applyCooldown(
                command.options.name,
                interaction.user.id,
                cooldownSeconds
            );

            if (remaining !== null) {
                throw new CooldownError(remaining);
            }
        }

        // Execute command
        await command.execute(interaction, client);
    } catch (error) {
        await handleCommandError(interaction, error);
    }
});

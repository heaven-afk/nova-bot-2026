import {
    EmbedBuilder,
    Colors,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'help',
        description: 'Show available commands',
        category: 'utility',
    },
    (cmd) =>
        cmd.addStringOption((opt) =>
            opt.setName('command').setDescription('Get help for a specific command')
        ),
    async (interaction, client) => {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            // Show specific command help
            const command = client.commands.get(commandName);

            if (!command) {
                await interaction.reply({
                    content: `Command \`${commandName}\` not found.`,
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

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // Show all commands with interactive buttons and select menu
        const categories = new Map<string, string[]>();

        client.commands.forEach((cmd) => {
            const cat = cmd.options.category;
            if (!categories.has(cat)) {
                categories.set(cat, []);
            }
            categories.get(cat)!.push(cmd.data.name);
        });

        const categoryEmojis: Record<string, string> = {
            mod: '🛡️',
            admin: '⚙️',
            utility: '🔧',
            roles: '👥',
        };

        // Main embed
        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('📚 Nova Bot Commands')
            .setDescription(
                'Click a **button** to view commands by category, or use the **dropdown** to get details on a specific command.\n\n' +
                `**Total Commands:** ${client.commands.size}`
            )
            .setThumbnail(client.user?.displayAvatarURL() || '')
            .setFooter({ text: 'Tip: Use /help <command> for quick access' })
            .setTimestamp();

        // Add category summaries
        categories.forEach((commands, category) => {
            const emoji = categoryEmojis[category] || '📁';
            embed.addFields({
                name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} (${commands.length})`,
                value: commands.slice(0, 5).map((c) => `\`${c}\``).join(', ') +
                    (commands.length > 5 ? ` +${commands.length - 5} more` : ''),
                inline: true,
            });
        });

        // Category buttons row
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('help_category:mod')
                .setLabel('Moderation')
                .setEmoji('🛡️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('help_category:utility')
                .setLabel('Utility')
                .setEmoji('🔧')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('help_category:admin')
                .setLabel('Admin')
                .setEmoji('⚙️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('help_category:roles')
                .setLabel('Roles')
                .setEmoji('👥')
                .setStyle(ButtonStyle.Secondary)
        );

        // Command select menu
        const selectOptions: StringSelectMenuOptionBuilder[] = [];
        client.commands.forEach((cmd) => {
            if (selectOptions.length < 25) {
                // Discord limit
                selectOptions.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`/${cmd.data.name}`)
                        .setDescription(cmd.data.description.slice(0, 100))
                        .setValue(cmd.data.name)
                        .setEmoji(categoryEmojis[cmd.options.category] || '📁')
                );
            }
        });

        const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('🔍 Select a command for details...')
                .addOptions(selectOptions)
        );

        await interaction.reply({
            embeds: [embed],
            components: [buttonRow, selectRow],
        });
    }
);

import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { configCache } from '../lib/cache.js';
import {
    handleCommandError,
    PermissionError,
    CooldownError,
    FeatureDisabledError,
} from '../lib/errors.js';

export default createEvent(Events.InteractionCreate, async (client, interaction) => {
    // Only handle chat input commands
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

            // Check mod-only commands
            if (command.options.modOnly) {
                const isMod = await configCache.isModerator(guildId, userRoles);
                if (!isMod) {
                    throw new PermissionError('You must be a moderator to use this command.');
                }
            }

            // Check admin-only commands
            if (command.options.adminOnly) {
                const isAdmin = await configCache.isAdmin(guildId, userRoles);
                if (!isAdmin) {
                    throw new PermissionError('You must be an administrator to use this command.');
                }
            }

            // Check custom command permissions
            const hasPermission = await configCache.hasCommandPermission(
                guildId,
                command.options.name,
                userRoles
            );
            if (!hasPermission) {
                throw new PermissionError();
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

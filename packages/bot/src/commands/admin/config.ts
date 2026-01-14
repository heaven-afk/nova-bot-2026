import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { configCache } from '../../lib/cache.js';

export default createCommand(
    {
        name: 'config',
        description: 'View current bot configuration',
        category: 'admin',
        adminOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    },
    (cmd) => cmd,
    async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const config = await configCache.get(interaction.guildId!);

        if (!config) {
            await interaction.editReply('Failed to fetch configuration.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('⚙️ Server Configuration')
            .setDescription('Configure settings via the [web dashboard](http://localhost:3000)')
            .addFields(
                {
                    name: 'Features',
                    value: [
                        `Moderation: ${config.features.moderation ? '✅' : '❌'}`,
                        `Logging: ${config.features.logging ? '✅' : '❌'}`,
                        `Welcome Messages: ${config.features.welcomeMessages ? '✅' : '❌'}`,
                        `Auto Roles: ${config.features.autoRoles ? '✅' : '❌'}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: 'Command Categories',
                    value: [
                        `Moderation: ${config.commands.categoryToggles.mod ? '✅' : '❌'}`,
                        `Admin: ${config.commands.categoryToggles.admin ? '✅' : '❌'}`,
                        `Utility: ${config.commands.categoryToggles.utility ? '✅' : '❌'}`,
                        `Roles: ${config.commands.categoryToggles.roles ? '✅' : '❌'}`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: 'Moderation',
                    value: [
                        `Mod Roles: ${config.moderation.modRoles.length || 'None set'}`,
                        `Admin Roles: ${config.moderation.adminRoles.length || 'None set'}`,
                        `Log Channel: ${config.moderation.logChannel ? `<#${config.moderation.logChannel}>` : 'Not set'}`,
                        `Auto-Timeout: ${config.moderation.autoTimeout.enabled ? `After ${config.moderation.autoTimeout.warnThreshold} warnings` : 'Disabled'}`,
                    ].join('\n'),
                }
            )
            .setFooter({ text: 'Use the dashboard for full configuration' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
);

import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { api } from '../../lib/api.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'clear-warnings',
        description: 'Clear all warnings for a user',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to clear warnings for').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for clearing warnings')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        // Can't clear your own warnings
        if (target.id === moderator.id) {
            throw new TargetError('You cannot clear your own warnings.');
        }

        await interaction.deferReply();

        // Get current warnings count
        const warningsResult = await api.getWarnings(interaction.guildId!, target.id);

        if (warningsResult.error) {
            throw new Error(`Failed to fetch warnings: ${warningsResult.error}`);
        }

        const warningCount = warningsResult.data?.count || 0;

        if (warningCount === 0) {
            throw new TargetError('This user has no warnings to clear.');
        }

        // Clear all warnings
        const clearResult = await api.clearWarnings(interaction.guildId!, target.id);

        if (clearResult.error) {
            throw new Error(`Failed to clear warnings: ${clearResult.error}`);
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Warnings Cleared')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Warnings Cleared', value: `${warningCount}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Clear Warnings',
            moderator,
            target,
            reason,
            additionalFields: [
                { name: 'Warnings Cleared', value: `${warningCount}`, inline: true }
            ],
        });
    }
);

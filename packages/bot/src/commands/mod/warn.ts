import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { api } from '../../lib/api.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'warn',
        description: 'Warn a user',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to warn').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for the warning')
                    .setRequired(true)
                    .setMaxLength(1000)
            ),
    async (interaction) => {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true);
        const moderator = interaction.user;

        // Can't warn yourself
        if (target.id === moderator.id) {
            throw new TargetError('You cannot warn yourself.');
        }

        // Can't warn bots
        if (target.bot) {
            throw new TargetError('You cannot warn bots.');
        }

        await interaction.deferReply();

        // Create warning in backend
        const result = await api.createWarning(interaction.guildId!, {
            userId: target.id,
            userTag: target.tag,
            modId: moderator.id,
            modTag: moderator.tag,
            reason,
        });

        if (result.error) {
            throw new Error(`Failed to create warning: ${result.error}`);
        }

        const { autoTimeout } = result.data!;

        // Build response embed
        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle('User Warned')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        // Handle auto-timeout
        if (autoTimeout.trigger && autoTimeout.duration) {
            const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
            if (member && member.moderatable) {
                await member.timeout(autoTimeout.duration * 1000, 'Auto-timeout: warning threshold reached');
                embed.addFields({
                    name: '⚠️ Auto-Timeout Applied',
                    value: `User has been timed out for ${autoTimeout.duration} seconds due to reaching the warning threshold.`,
                });
            }
        }

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Warn',
            moderator,
            target,
            reason,
        });
    }
);

import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'untimeout',
        description: 'Remove timeout from a user',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to remove timeout from').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for removing the timeout')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        if (!target || !('timeout' in target)) {
            throw new TargetError('Could not find that member in this server.');
        }

        // Check if user is actually timed out
        if (!target.communicationDisabledUntil) {
            throw new TargetError('This user is not currently timed out.');
        }

        // Check if moderatable
        if (!target.moderatable) {
            throw new TargetError('I cannot modify this user. They may have higher permissions.');
        }

        await interaction.deferReply();

        // Remove timeout (set to null)
        await target.timeout(null, `${moderator.tag}: ${reason}`);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Timeout Removed')
            .addFields(
                { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Untimeout',
            moderator,
            target: target.user,
            reason,
        });
    }
);

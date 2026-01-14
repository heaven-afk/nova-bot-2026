import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'kick',
        description: 'Kick a user from the server',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.KickMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to kick').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for the kick')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        if (!target || !('kick' in target)) {
            throw new TargetError('Could not find that member in this server.');
        }

        // Can't kick yourself
        if (target.id === moderator.id) {
            throw new TargetError('You cannot kick yourself.');
        }

        // Check if kickable
        if (!target.kickable) {
            throw new TargetError('I cannot kick this user. They may have higher permissions.');
        }

        await interaction.deferReply();

        // Try to DM the user before kicking
        try {
            await target.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle(`You were kicked from ${interaction.guild!.name}`)
                        .addFields({ name: 'Reason', value: reason })
                        .setTimestamp(),
                ],
            });
        } catch {
            // User may have DMs disabled
        }

        // Kick the user
        await target.kick(`${moderator.tag}: ${reason}`);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('User Kicked')
            .addFields(
                { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Kick',
            moderator,
            target: target.user,
            reason,
        });
    }
);

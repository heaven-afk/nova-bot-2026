import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'ban',
        description: 'Ban a user from the server',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to ban').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for the ban')
                    .setMaxLength(500)
            )
            .addIntegerOption((opt) =>
                opt
                    .setName('delete_days')
                    .setDescription('Days of messages to delete (0-7)')
                    .setMinValue(0)
                    .setMaxValue(7)
            ),
    async (interaction) => {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const moderator = interaction.user;

        // Can't ban yourself
        if (target.id === moderator.id) {
            throw new TargetError('You cannot ban yourself.');
        }

        // Check if the user is in the guild
        const member = await interaction.guild!.members.fetch(target.id).catch(() => null);

        if (member) {
            // Check if bannable
            if (!member.bannable) {
                throw new TargetError('I cannot ban this user. They may have higher permissions.');
            }
        }

        await interaction.deferReply();

        // Try to DM the user before banning
        try {
            await target.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.DarkRed)
                        .setTitle(`You were banned from ${interaction.guild!.name}`)
                        .addFields({ name: 'Reason', value: reason })
                        .setTimestamp(),
                ],
            });
        } catch {
            // User may have DMs disabled or not share a server
        }

        // Ban the user
        await interaction.guild!.members.ban(target.id, {
            reason: `${moderator.tag}: ${reason}`,
            deleteMessageSeconds: deleteDays * 86400,
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.DarkRed)
            .setTitle('User Banned')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        if (deleteDays > 0) {
            embed.addFields({ name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Ban',
            moderator,
            target,
            reason,
        });
    }
);

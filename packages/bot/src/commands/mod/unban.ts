import { PermissionFlagsBits, EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { logger } from '../../lib/logger.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'unban',
        description: 'Unban a user from the server',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    },
    (cmd) =>
        cmd
            .addStringOption((opt) =>
                opt.setName('user_id').setDescription('The user ID to unban').setRequired(true)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for the unban')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const userId = interaction.options.getString('user_id', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
            throw new TargetError('Invalid user ID format. Please provide a valid Discord user ID.');
        }

        await interaction.deferReply();

        // Check if user is actually banned
        const bans = await interaction.guild!.bans.fetch();
        const bannedUser = bans.get(userId);

        if (!bannedUser) {
            throw new TargetError('This user is not banned from this server.');
        }

        // Unban the user
        await interaction.guild!.members.unban(userId, `${moderator.tag}: ${reason}`);

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('User Unbanned')
            .addFields(
                { name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the action
        await logger.modAction(interaction.guild!, {
            action: 'Unban',
            moderator,
            target: bannedUser.user,
            reason,
        });
    }
);

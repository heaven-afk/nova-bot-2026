import { EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'avatar',
        description: 'Get a user\'s avatar',
        category: 'utility',
    },
    (cmd) =>
        cmd
            .addUserOption((opt) =>
                opt.setName('user').setDescription('The user to get the avatar of (defaults to you)')
            )
            .addBooleanOption((opt) =>
                opt.setName('server').setDescription('Show server avatar instead of global avatar')
            ),
    async (interaction) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const showServer = interaction.options.getBoolean('server') || false;

        let avatarUrl: string;
        let avatarType: string;

        if (showServer && interaction.guild) {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (member?.avatar) {
                avatarUrl = member.displayAvatarURL({ size: 4096, extension: 'png' });
                avatarType = 'Server Avatar';
            } else {
                avatarUrl = targetUser.displayAvatarURL({ size: 4096, extension: 'png' });
                avatarType = 'Global Avatar (no server avatar set)';
            }
        } else {
            avatarUrl = targetUser.displayAvatarURL({ size: 4096, extension: 'png' });
            avatarType = 'Global Avatar';
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle(`${targetUser.displayName}'s Avatar`)
            .setDescription(`**${avatarType}**`)
            .setImage(avatarUrl)
            .addFields(
                { name: 'Links', value: `[PNG](${targetUser.displayAvatarURL({ size: 4096, extension: 'png' })}) • [JPG](${targetUser.displayAvatarURL({ size: 4096, extension: 'jpg' })}) • [WEBP](${targetUser.displayAvatarURL({ size: 4096, extension: 'webp' })})` }
            )
            .setFooter({ text: `Requested by ${interaction.user.displayName}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
);

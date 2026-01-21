import { EmbedBuilder, Colors, OAuth2Scopes, PermissionFlagsBits } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'invite',
        description: 'Get the bot invite link',
        category: 'utility',
    },
    (cmd) => cmd,
    async (interaction, client) => {
        const inviteUrl = client.generateInvite({
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            permissions: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.UseExternalEmojis,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.KickMembers,
                PermissionFlagsBits.BanMembers,
                PermissionFlagsBits.ModerateMembers,
            ],
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('🎉 Invite Nova Bot')
            .setDescription(`Click the button below or use this link to invite Nova to your server!\n\n**[Invite Nova Bot](${inviteUrl})**`)
            .setThumbnail(client.user?.displayAvatarURL() || '')
            .addFields(
                { name: '🏠 Current Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Total Users', value: `${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}`, inline: true }
            )
            .setFooter({ text: 'Thank you for using Nova!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
);

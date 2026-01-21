import { PermissionFlagsBits, EmbedBuilder, Colors, ChannelType, TextChannel } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'unlock',
        description: 'Unlock a channel (allow members to send messages)',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    },
    (cmd) =>
        cmd
            .addChannelOption((opt) =>
                opt
                    .setName('channel')
                    .setDescription('Channel to unlock (defaults to current)')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for unlocking the channel')
                    .setMaxLength(500)
            ),
    async (interaction) => {
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!targetChannel || !('permissionOverwrites' in targetChannel)) {
            throw new TargetError('Invalid channel. Please select a text channel.');
        }

        await interaction.deferReply();

        // Get the @everyone role
        const everyoneRole = interaction.guild!.roles.everyone;

        // Unlock the channel by resetting SendMessages for @everyone
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: null, // Reset to default (inherit from category/server)
        }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('🔓 Channel Unlocked')
            .setDescription('Members can now send messages in this channel again.')
            .addFields(
                { name: 'Channel', value: `<#${targetChannel.id}>`, inline: true },
                { name: 'Unlocked By', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
);

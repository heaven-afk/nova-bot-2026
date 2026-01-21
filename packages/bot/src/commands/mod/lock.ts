import { PermissionFlagsBits, EmbedBuilder, Colors, ChannelType, TextChannel } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'lock',
        description: 'Lock a channel (prevent members from sending messages)',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    },
    (cmd) =>
        cmd
            .addChannelOption((opt) =>
                opt
                    .setName('channel')
                    .setDescription('Channel to lock (defaults to current)')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            )
            .addStringOption((opt) =>
                opt
                    .setName('reason')
                    .setDescription('Reason for locking the channel')
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

        // Lock the channel by denying SendMessages for @everyone
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: false,
        }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('🔒 Channel Locked')
            .setDescription('Members can no longer send messages in this channel.')
            .addFields(
                { name: 'Channel', value: `<#${targetChannel.id}>`, inline: true },
                { name: 'Locked By', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
);

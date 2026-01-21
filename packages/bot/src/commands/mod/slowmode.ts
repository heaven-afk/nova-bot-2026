import { PermissionFlagsBits, EmbedBuilder, Colors, ChannelType, TextChannel } from 'discord.js';
import { createCommand } from '../../types/Command.js';
import { TargetError } from '../../lib/errors.js';

export default createCommand(
    {
        name: 'slowmode',
        description: 'Set slowmode for a channel',
        category: 'mod',
        modOnly: true,
        defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    },
    (cmd) =>
        cmd
            .addIntegerOption((opt) =>
                opt
                    .setName('seconds')
                    .setDescription('Slowmode delay in seconds (0 to disable)')
                    .setRequired(true)
                    .setMinValue(0)
                    .setMaxValue(21600) // 6 hours max
            )
            .addChannelOption((opt) =>
                opt
                    .setName('channel')
                    .setDescription('Channel to set slowmode in (defaults to current)')
                    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            ),
    async (interaction) => {
        const seconds = interaction.options.getInteger('seconds', true);
        const targetChannel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;

        if (!targetChannel || !('setRateLimitPerUser' in targetChannel)) {
            throw new TargetError('Invalid channel. Please select a text channel.');
        }

        await interaction.deferReply();

        await targetChannel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);

        let durationText: string;
        if (seconds === 0) {
            durationText = 'disabled';
        } else if (seconds < 60) {
            durationText = `${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            durationText = `${mins} minute${mins !== 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            durationText = `${hours} hour${hours !== 1 ? 's' : ''}`;
        }

        const embed = new EmbedBuilder()
            .setColor(seconds === 0 ? Colors.Green : Colors.Orange)
            .setTitle(seconds === 0 ? '🏃 Slowmode Disabled' : '🐢 Slowmode Enabled')
            .addFields(
                { name: 'Channel', value: `<#${targetChannel.id}>`, inline: true },
                { name: 'Duration', value: durationText, inline: true },
                { name: 'Set By', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
);

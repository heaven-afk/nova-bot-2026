import { EmbedBuilder, Colors } from 'discord.js';
import { createCommand } from '../../types/Command.js';

export default createCommand(
    {
        name: 'ping',
        description: 'Check bot latency',
        category: 'utility',
    },
    (cmd) => cmd,
    async (interaction, client) => {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true,
        });

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Roundtrip', value: `${roundtrip}ms`, inline: true },
                { name: 'WebSocket', value: `${wsLatency}ms`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
);

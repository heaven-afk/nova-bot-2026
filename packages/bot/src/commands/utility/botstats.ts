import { EmbedBuilder, Colors, version as djsVersion } from 'discord.js';
import { createCommand } from '../../types/Command.js';

function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default createCommand(
    {
        name: 'botstats',
        description: 'View bot statistics and information',
        category: 'utility',
    },
    (cmd) => cmd,
    async (interaction, client) => {
        const uptime = client.uptime || 0;
        const memUsage = process.memoryUsage();

        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('📊 Bot Statistics')
            .setThumbnail(client.user?.displayAvatarURL() || '')
            .addFields(
                { name: '🤖 Bot', value: client.user?.tag || 'Unknown', inline: true },
                { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: '⏱️ Uptime', value: formatUptime(uptime), inline: true },
                { name: '🏠 Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Users', value: `${totalMembers.toLocaleString()}`, inline: true },
                { name: '💬 Channels', value: `${totalChannels.toLocaleString()}`, inline: true },
                { name: '💾 Memory', value: formatBytes(memUsage.heapUsed), inline: true },
                { name: '📦 Discord.js', value: `v${djsVersion}`, inline: true },
                { name: '🟢 Node.js', value: process.version, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.displayName}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
);

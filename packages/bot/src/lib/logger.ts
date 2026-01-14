import {
    EmbedBuilder,
    TextChannel,
    GuildMember,
    User,
    Guild,
    Colors,
} from 'discord.js';
import { configCache } from './cache.js';

export type LogType = 'moderation' | 'messages' | 'members';

interface ModLogData {
    action: string;
    moderator: User;
    target: User | GuildMember;
    reason?: string;
    duration?: string;
    additionalFields?: Array<{ name: string; value: string; inline?: boolean }>;
}

interface MessageLogData {
    action: 'delete' | 'edit';
    author: User;
    channel: TextChannel;
    content?: string;
    oldContent?: string;
    newContent?: string;
}

interface MemberLogData {
    action: 'join' | 'leave';
    member: GuildMember | User;
    additionalInfo?: string;
}

const LOG_COLORS = {
    warn: Colors.Yellow,
    timeout: Colors.Orange,
    kick: Colors.Red,
    ban: Colors.DarkRed,
    unban: Colors.Green,
    delete: Colors.Grey,
    edit: Colors.Blue,
    join: Colors.Green,
    leave: Colors.Red,
} as const;

async function getLogChannel(
    guild: Guild,
    logType: LogType
): Promise<TextChannel | null> {
    const config = await configCache.get(guild.id);

    if (!config || !config.features.logging) {
        return null;
    }

    const channelId = config.logging.channels[logType];
    if (!channelId) {
        return null;
    }

    try {
        const channel = await guild.channels.fetch(channelId);
        if (channel && channel.isTextBased() && 'send' in channel) {
            return channel as TextChannel;
        }
    } catch {
        console.error(`Failed to fetch log channel ${channelId} for guild ${guild.id}`);
    }

    return null;
}

export const logger = {
    async modAction(guild: Guild, data: ModLogData): Promise<void> {
        const config = await configCache.get(guild.id);
        if (!config?.logging.events.modActions) return;

        const channel = await getLogChannel(guild, 'moderation');
        if (!channel) return;

        const color = LOG_COLORS[data.action.toLowerCase() as keyof typeof LOG_COLORS] || Colors.Blurple;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Moderation Action: ${data.action}`)
            .addFields(
                { name: 'Moderator', value: `${data.moderator.tag} (${data.moderator.id})`, inline: true },
                { name: 'Target', value: `${data.target instanceof GuildMember ? data.target.user.tag : data.target.tag} (${data.target.id})`, inline: true }
            )
            .setTimestamp();

        if (data.reason) {
            embed.addFields({ name: 'Reason', value: data.reason });
        }

        if (data.duration) {
            embed.addFields({ name: 'Duration', value: data.duration, inline: true });
        }

        if (data.additionalFields) {
            embed.addFields(...data.additionalFields);
        }

        embed.setFooter({ text: `Target ID: ${data.target.id}` });

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to log mod action in guild ${guild.id}:`, error);
        }
    },

    async messageEvent(guild: Guild, data: MessageLogData): Promise<void> {
        const config = await configCache.get(guild.id);

        if (data.action === 'delete' && !config?.logging.events.messageDelete) return;
        if (data.action === 'edit' && !config?.logging.events.messageEdit) return;

        const channel = await getLogChannel(guild, 'messages');
        if (!channel) return;

        const color = LOG_COLORS[data.action];

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Message ${data.action === 'delete' ? 'Deleted' : 'Edited'}`)
            .addFields(
                { name: 'Author', value: `${data.author.tag} (${data.author.id})`, inline: true },
                { name: 'Channel', value: `${data.channel.name} (<#${data.channel.id}>)`, inline: true }
            )
            .setTimestamp();

        if (data.action === 'delete' && data.content) {
            embed.addFields({
                name: 'Content',
                value: data.content.slice(0, 1024) || '[No text content]',
            });
        }

        if (data.action === 'edit') {
            if (data.oldContent) {
                embed.addFields({
                    name: 'Before',
                    value: data.oldContent.slice(0, 1024) || '[No text content]',
                });
            }
            if (data.newContent) {
                embed.addFields({
                    name: 'After',
                    value: data.newContent.slice(0, 1024) || '[No text content]',
                });
            }
        }

        embed.setFooter({ text: `Author ID: ${data.author.id}` });

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to log message event in guild ${guild.id}:`, error);
        }
    },

    async memberEvent(guild: Guild, data: MemberLogData): Promise<void> {
        const config = await configCache.get(guild.id);

        if (data.action === 'join' && !config?.logging.events.memberJoin) return;
        if (data.action === 'leave' && !config?.logging.events.memberLeave) return;

        const channel = await getLogChannel(guild, 'members');
        if (!channel) return;

        const color = LOG_COLORS[data.action];
        const user = data.member instanceof GuildMember ? data.member.user : data.member;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Member ${data.action === 'join' ? 'Joined' : 'Left'}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'User', value: `${user.tag}`, inline: true },
                { name: 'ID', value: user.id, inline: true }
            )
            .setTimestamp();

        if (data.member instanceof GuildMember) {
            const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
            embed.addFields({ name: 'Account Age', value: `${accountAge} days`, inline: true });
        }

        if (data.additionalInfo) {
            embed.addFields({ name: 'Additional Info', value: data.additionalInfo });
        }

        embed.setFooter({ text: `User ID: ${user.id}` });

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to log member event in guild ${guild.id}:`, error);
        }
    },
};

import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { logger } from '../lib/logger.js';
import { configCache } from '../lib/cache.js';

export default createEvent(Events.GuildMemberAdd, async (_client, member) => {
    const config = await configCache.get(member.guild.id);
    if (!config) return;

    // Log member join
    await logger.memberEvent(member.guild, {
        action: 'join',
        member,
    });

    // Auto-roles
    if (config.features.autoRoles && config.autoRoles.enabled && config.autoRoles.roles.length > 0) {
        try {
            await member.roles.add(config.autoRoles.roles, 'Auto-role on join');
        } catch (error) {
            console.error(`Failed to add auto-roles in ${member.guild.id}:`, error);
        }
    }

    // Welcome message
    if (config.features.welcomeMessages && config.welcome.enabled) {
        // Channel welcome
        if (config.welcome.channelId && config.welcome.message) {
            try {
                const channel = await member.guild.channels.fetch(config.welcome.channelId);
                if (channel && channel.isTextBased() && 'send' in channel) {
                    const message = config.welcome.message
                        .replace(/{user}/g, `<@${member.id}>`)
                        .replace(/{username}/g, member.user.username)
                        .replace(/{server}/g, member.guild.name)
                        .replace(/{memberCount}/g, member.guild.memberCount.toString());

                    await channel.send(message);
                }
            } catch (error) {
                console.error(`Failed to send welcome message in ${member.guild.id}:`, error);
            }
        }

        // DM welcome
        if (config.welcome.dmEnabled && config.welcome.dmMessage) {
            try {
                const message = config.welcome.dmMessage
                    .replace(/{user}/g, member.user.username)
                    .replace(/{username}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name);

                await member.send(message);
            } catch (error) {
                // User may have DMs disabled
                console.warn(`Failed to send welcome DM to ${member.id}:`, error);
            }
        }
    }
});

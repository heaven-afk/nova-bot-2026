import { Events, TextChannel } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { logger } from '../lib/logger.js';

export default createEvent(Events.MessageDelete, async (_client, message) => {
    // Ignore partials we can't fetch, DMs, and bot messages
    if (!message.guild) return;
    if (message.author?.bot) return;

    await logger.messageEvent(message.guild, {
        action: 'delete',
        author: message.author!,
        channel: message.channel as TextChannel,
        content: message.content || undefined,
    });
});

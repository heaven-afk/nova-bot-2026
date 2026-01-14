import { Events, TextChannel } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { logger } from '../lib/logger.js';

export default createEvent(Events.MessageUpdate, async (_client, oldMessage, newMessage) => {
    // Ignore partials we can't fetch, DMs, and bot messages
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    // Ignore if content didn't change (e.g., embed loading)
    if (oldMessage.content === newMessage.content) return;

    await logger.messageEvent(newMessage.guild, {
        action: 'edit',
        author: newMessage.author!,
        channel: newMessage.channel as TextChannel,
        oldContent: oldMessage.content || undefined,
        newContent: newMessage.content || undefined,
    });
});

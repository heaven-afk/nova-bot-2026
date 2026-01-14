import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { logger } from '../lib/logger.js';

export default createEvent(Events.GuildMemberRemove, async (_client, member) => {
    await logger.memberEvent(member.guild, {
        action: 'leave',
        member: member as any, // Cast to any to handle PartialGuildMember since we can't fetch left members
    });
});

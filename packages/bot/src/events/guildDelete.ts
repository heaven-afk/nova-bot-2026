import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { api as _api } from '../lib/api.js';
import { configCache } from '../lib/cache.js';

export default createEvent(Events.GuildDelete, async (_client, guild) => {
    console.log(`✗ Left guild: ${guild.name} (${guild.id})`);

    // Invalidate cache
    configCache.invalidate(guild.id);

    // Optionally delete guild config (uncomment if you want to clean up)
    // const result = await api.deleteGuildConfig(guild.id);
    // if (result.error) {
    //   console.error(`Failed to delete config for guild ${guild.id}:`, result.error);
    // }
});

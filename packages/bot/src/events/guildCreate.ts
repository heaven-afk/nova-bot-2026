import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { api } from '../lib/api.js';

export default createEvent(Events.GuildCreate, async (_client, guild) => {
    console.log(`✓ Joined guild: ${guild.name} (${guild.id})`);

    // Create guild config in backend
    const result = await api.createGuildConfig(guild.id);
    if (result.error) {
        console.error(`Failed to create config for guild ${guild.id}:`, result.error);
    }
});

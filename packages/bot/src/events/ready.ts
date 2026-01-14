import { Events } from 'discord.js';
import { createEvent } from '../types/Event.js';
import { loadCommands, loadEvents, registerCommands } from '../handlers/index.js';

export default createEvent(Events.ClientReady, async (client) => {
    console.log(`✓ Logged in as ${client.user?.tag}`);
    console.log(`✓ Serving ${client.guilds.cache.size} guilds`);

    // Load commands and events
    await loadCommands(client);
    await loadEvents(client);

    // Register slash commands if in development
    if (process.env.NODE_ENV === 'development') {
        await registerCommands(client);
    }
}, true);

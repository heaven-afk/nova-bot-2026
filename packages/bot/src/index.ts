import 'dotenv/config';
import { NovaClient } from './client.js';
import { loadCommands, loadEvents } from './handlers/index.js';

const client = new NovaClient();

async function start() {
    try {
        // Load events first (including ready event)
        await loadEvents(client);

        // Load commands
        await loadCommands(client);

        // Login
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            throw new Error('DISCORD_TOKEN is not set');
        }

        await client.login(token);
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    client.destroy();
    process.exit(0);
});

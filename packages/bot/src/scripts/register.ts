import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Point to packages/bot/.env
dotenv.config({ path: join(__dirname, '../../.env') });

import { NovaClient } from '../client.js';
import { loadCommands, registerCommands } from '../handlers/index.js';

async function register() {
    console.log('Environment Debug:');
    console.log(`- Token present: ${!!process.env.DISCORD_TOKEN}`);
    console.log(`- Client ID present: ${!!process.env.DISCORD_CLIENT_ID}`);
    if (process.env.DISCORD_CLIENT_ID) {
        console.log(`- Client ID: ${process.env.DISCORD_CLIENT_ID}`);
    }

    const client = new NovaClient();

    console.log('Loading commands...');
    await loadCommands(client);

    console.log('Registering commands globally...');
    await registerCommands(client);

    console.log('Done!');
    process.exit(0);
}

register().catch((error) => {
    console.error('Failed to register commands:', error);
    process.exit(1);
});

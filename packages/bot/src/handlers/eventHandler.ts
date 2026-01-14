import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { NovaClient } from '../client.js';
import { Event } from '../types/Event.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client: NovaClient): Promise<void> {
    const eventsPath = join(__dirname, '..', 'events');
    const eventFiles = readdirSync(eventsPath).filter(
        (file) => file.endsWith('.js') || file.endsWith('.ts')
    );

    for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        try {
            const module = await import(`file://${filePath}`);
            const event: Event = module.default || module;

            if (!event.name || !event.execute) {
                console.warn(`Skipping ${file}: missing name or execute`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }

            console.log(`✓ Loaded event: ${event.name}${event.once ? ' (once)' : ''}`);
        } catch (error) {
            console.error(`Failed to load event ${file}:`, error);
        }
    }
}

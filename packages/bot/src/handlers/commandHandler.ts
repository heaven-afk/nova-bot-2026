import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { NovaClient } from '../client.js';
import { Command } from '../types/Command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client: NovaClient): Promise<void> {
    const commandsPath = join(__dirname, '..', 'commands');
    const categories = readdirSync(commandsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    for (const category of categories) {
        const categoryPath = join(commandsPath, category);
        const commandFiles = readdirSync(categoryPath).filter(
            (file) => file.endsWith('.js') || file.endsWith('.ts')
        );

        for (const file of commandFiles) {
            const filePath = join(categoryPath, file);
            try {
                const module = await import(`file://${filePath}`);
                const command: Command = module.default || module;

                if (!command.data || !command.execute) {
                    console.warn(`Skipping ${file}: missing data or execute`);
                    continue;
                }

                client.commands.set(command.data.name, command);
                console.log(`✓ Loaded command: ${command.data.name} (${category})`);
            } catch (error) {
                console.error(`Failed to load command ${file}:`, error);
            }
        }
    }

    console.log(`✓ Loaded ${client.commands.size} commands`);
}

export async function registerCommands(client: NovaClient): Promise<void> {
    const token = process.env.DISCORD_TOKEN!;
    const clientId = process.env.DISCORD_CLIENT_ID!;

    const rest = new REST({ version: '10' }).setToken(token);

    const commandData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    client.commands.forEach((command) => {
        commandData.push(command.data.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody);
    });

    try {
        console.log(`Registering ${commandData.length} application commands...`);

        await rest.put(Routes.applicationCommands(clientId), {
            body: commandData,
        });

        console.log('✓ Successfully registered application commands');
    } catch (error) {
        console.error('Failed to register commands:', error);
        throw error;
    }
}

import {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    SlashCommandOptionsOnlyBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
} from 'discord.js';
import { NovaClient } from '../client.js';

export type CommandCategory = 'mod' | 'admin' | 'utility' | 'roles';

// Union type for all valid command builder return types
type CommandBuilder =
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export interface CommandOptions {
    name: string;
    description: string;
    category: CommandCategory;
    defaultMemberPermissions?: bigint;
    dmPermission?: boolean;
    cooldown?: number; // seconds
    modOnly?: boolean;
    adminOnly?: boolean;
}

export interface Command {
    data: CommandBuilder;
    options: CommandOptions;
    execute: (interaction: ChatInputCommandInteraction, client: NovaClient) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction, client: NovaClient) => Promise<void>;
}

// Helper to create standardized command metadata
export function createCommand(
    options: CommandOptions,
    builder: (cmd: SlashCommandBuilder) => CommandBuilder,
    execute: Command['execute'],
    autocomplete?: Command['autocomplete']
): Command {
    const baseBuilder = new SlashCommandBuilder()
        .setName(options.name)
        .setDescription(options.description)
        .setDMPermission(options.dmPermission ?? false);

    if (options.defaultMemberPermissions !== undefined) {
        baseBuilder.setDefaultMemberPermissions(options.defaultMemberPermissions);
    }

    return {
        data: builder(baseBuilder),
        options,
        execute,
        autocomplete,
    };
}

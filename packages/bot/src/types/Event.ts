import { ClientEvents } from 'discord.js';
import { NovaClient } from '../client.js';

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (client: NovaClient, ...args: ClientEvents[K]) => Promise<void> | void;
}

export function createEvent<K extends keyof ClientEvents>(
    name: K,
    execute: Event<K>['execute'],
    once = false
): Event<K> {
    return { name, execute, once };
}

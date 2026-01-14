import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { Command } from './types/Command.js';

export class NovaClient extends Client {
    commands: Collection<string, Command> = new Collection();
    cooldowns: Collection<string, Collection<string, number>> = new Collection();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildModeration,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
        });
    }

    // Check and apply cooldown
    applyCooldown(commandName: string, userId: string, cooldownSeconds: number): number | null {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Collection());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(commandName)!;
        const cooldownAmount = cooldownSeconds * 1000;

        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId)! + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return timeLeft;
            }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount);

        return null;
    }
}

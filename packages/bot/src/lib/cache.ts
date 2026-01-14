import { GuildConfig } from '../types/Guild.js';
import { api } from './api.js';

interface CacheEntry {
    config: GuildConfig;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 1 minute

export const configCache = {
    async get(guildId: string): Promise<GuildConfig | null> {
        const cached = cache.get(guildId);

        if (cached && cached.expiresAt > Date.now()) {
            return cached.config;
        }

        // Fetch from API
        const result = await api.getGuildConfig(guildId);

        if (result.error || !result.data) {
            console.error(`Failed to fetch config for guild ${guildId}:`, result.error);
            return null;
        }

        // Cache the result
        cache.set(guildId, {
            config: result.data,
            expiresAt: Date.now() + CACHE_TTL,
        });

        return result.data;
    },

    invalidate(guildId: string): void {
        cache.delete(guildId);
    },

    invalidateAll(): void {
        cache.clear();
    },

    // Check if a command is enabled
    async isCommandEnabled(
        guildId: string,
        commandName: string,
        category: string
    ): Promise<boolean> {
        const config = await this.get(guildId);
        if (!config) return true; // Default to enabled if no config

        // Check if category is disabled
        const categoryKey = category as keyof typeof config.commands.categoryToggles;
        if (!config.commands.categoryToggles[categoryKey]) {
            return false;
        }

        // Check if specific command is disabled
        if (config.commands.disabled.includes(commandName)) {
            return false;
        }

        return true;
    },

    // Check if user has permission to use a command
    async hasCommandPermission(
        guildId: string,
        commandName: string,
        userRoles: string[]
    ): Promise<boolean> {
        const config = await this.get(guildId);
        if (!config) return true; // Default to allowed if no config

        const requiredRoles = config.commands.permissions[commandName];
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No role restrictions
        }

        return userRoles.some((role) => requiredRoles.includes(role));
    },

    // Check if user is a moderator
    async isModerator(guildId: string, userRoles: string[]): Promise<boolean> {
        const config = await this.get(guildId);
        if (!config) return false;

        const modRoles = config.moderation.modRoles;
        const adminRoles = config.moderation.adminRoles;

        return userRoles.some(
            (role) => modRoles.includes(role) || adminRoles.includes(role)
        );
    },

    // Check if user is an admin
    async isAdmin(guildId: string, userRoles: string[]): Promise<boolean> {
        const config = await this.get(guildId);
        if (!config) return false;

        return userRoles.some((role) => config.moderation.adminRoles.includes(role));
    },

    // Get command cooldown
    async getCooldown(guildId: string, commandName: string): Promise<number> {
        const config = await this.get(guildId);
        if (!config) return 0;

        return config.commands.cooldowns[commandName] || 0;
    },
};

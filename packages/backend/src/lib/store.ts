export interface GuildInfo {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

export interface CachedGuilds {
    guilds: GuildInfo[];
    expiresAt: number;
}

// Global in-memory cache for user guilds
export const guildsCache = new Map<string, CachedGuilds>();

import { GuildConfig } from '../types/Guild.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': INTERNAL_API_KEY,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
            return { error: errorBody.error || `HTTP ${response.status}` };
        }

        const data = await response.json() as T;
        return { data };
    } catch (error) {
        console.error(`API request failed: ${endpoint}`, error);
        return { error: 'Failed to connect to backend' };
    }
}

export const api = {
    // Guild config
    async getGuildConfig(guildId: string): Promise<ApiResponse<GuildConfig>> {
        return request<GuildConfig>(`/api/guilds/internal/${guildId}`);
    },

    async createGuildConfig(guildId: string): Promise<ApiResponse<GuildConfig>> {
        return request<GuildConfig>(`/api/guilds/internal/${guildId}`, {
            method: 'POST',
        });
    },

    async deleteGuildConfig(guildId: string): Promise<ApiResponse<{ success: boolean }>> {
        return request<{ success: boolean }>(`/api/guilds/internal/${guildId}`, {
            method: 'DELETE',
        });
    },

    // Moderation
    async createWarning(
        guildId: string,
        data: {
            userId: string;
            userTag: string;
            modId: string;
            modTag: string;
            reason: string;
        }
    ): Promise<ApiResponse<{
        warning: unknown;
        autoTimeout: { trigger: boolean; duration?: number };
    }>> {
        return request(`/api/moderation/${guildId}/warnings`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getWarnings(
        guildId: string,
        userId: string
    ): Promise<ApiResponse<{ warnings: unknown[]; count: number }>> {
        return request(`/api/moderation/${guildId}/warnings/${userId}`);
    },

    async deleteWarning(
        guildId: string,
        warningId: string
    ): Promise<ApiResponse<{ success: boolean }>> {
        return request(`/api/moderation/${guildId}/warnings/${warningId}`, {
            method: 'DELETE',
        });
    },

    async clearWarnings(
        guildId: string,
        userId: string
    ): Promise<ApiResponse<{ success: boolean; deleted: number }>> {
        return request(`/api/moderation/${guildId}/warnings/user/${userId}`, {
            method: 'DELETE',
        });
    },

    async getModerationConfig(
        guildId: string
    ): Promise<ApiResponse<{
        modRoles: string[];
        adminRoles: string[];
        logChannel?: string;
        muteRole?: string;
        autoTimeout: { enabled: boolean; warnThreshold: number; duration: number };
    }>> {
        return request(`/api/moderation/${guildId}/config`);
    },
};

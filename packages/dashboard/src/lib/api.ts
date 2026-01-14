const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        if (response.status === 401) {
            // Token expired, redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            return { error: 'Unauthorized' };
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { error: error.error || `HTTP ${response.status}` };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API request failed:', error);
        return { error: 'Failed to connect to server' };
    }
}

export const api = {
    auth: {
        getLoginUrl: () => `${BACKEND_URL}/api/auth/discord`,
        async getMe() {
            return fetchApi<{
                user: {
                    id: string;
                    username: string;
                    discriminator: string;
                    avatar: string | null;
                    guilds: Array<{
                        id: string;
                        name: string;
                        icon: string | null;
                        owner: boolean;
                        permissions: string;
                    }>;
                };
            }>('/api/auth/me');
        },
        logout() {
            localStorage.removeItem('token');
            window.location.href = '/login';
        },
    },

    guilds: {
        async getConfig(guildId: string) {
            return fetchApi<GuildConfig>(`/api/guilds/${guildId}`);
        },
        async updateConfig(guildId: string, updates: Partial<GuildConfig>) {
            return fetchApi<GuildConfig>(`/api/guilds/${guildId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
        },
        async getAuditLogs(guildId: string, page = 1) {
            return fetchApi<{
                logs: AuditLog[];
                pagination: { page: number; limit: number; total: number; pages: number };
            }>(`/api/guilds/${guildId}/audit?page=${page}`);
        },
    },

    commands: {
        async getConfig(guildId: string) {
            return fetchApi<CommandConfig>(`/api/commands/${guildId}`);
        },
        async updateConfig(guildId: string, updates: Partial<CommandConfig>) {
            return fetchApi<CommandConfig>(`/api/commands/${guildId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
        },
        async toggle(guildId: string, commandName: string) {
            return fetchApi<{ command: string; enabled: boolean }>(
                `/api/commands/${guildId}/toggle/${commandName}`,
                { method: 'POST' }
            );
        },
    },
};

// Types
export interface GuildConfig {
    guildId: string;
    settings: {
        locale: string;
        timezone: string;
    };
    features: {
        moderation: boolean;
        logging: boolean;
        welcomeMessages: boolean;
        autoRoles: boolean;
    };
    moderation: {
        modRoles: string[];
        adminRoles: string[];
        logChannel?: string;
        muteRole?: string;
        autoTimeout: {
            enabled: boolean;
            warnThreshold: number;
            duration: number;
        };
    };
    logging: {
        enabled: boolean;
        channels: {
            moderation?: string;
            messages?: string;
            members?: string;
        };
        events: {
            messageDelete: boolean;
            messageEdit: boolean;
            memberJoin: boolean;
            memberLeave: boolean;
            modActions: boolean;
        };
    };
    commands: {
        disabled: string[];
        categoryToggles: {
            mod: boolean;
            admin: boolean;
            utility: boolean;
            roles: boolean;
        };
        permissions: Record<string, string[]>;
        cooldowns: Record<string, number>;
    };
    welcome: {
        enabled: boolean;
        channelId?: string;
        message?: string;
        dmEnabled: boolean;
        dmMessage?: string;
    };
    autoRoles: {
        enabled: boolean;
        roles: string[];
    };
}

export interface CommandConfig {
    disabled: string[];
    categoryToggles: {
        mod: boolean;
        admin: boolean;
        utility: boolean;
        roles: boolean;
    };
    permissions: Record<string, string[]>;
    cooldowns: Record<string, number>;
}

export interface AuditLog {
    _id: string;
    guildId: string;
    userId: string;
    userTag: string;
    action: string;
    target: string;
    changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
    createdAt: string;
}

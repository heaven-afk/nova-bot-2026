// Guild configuration type for bot consumption
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

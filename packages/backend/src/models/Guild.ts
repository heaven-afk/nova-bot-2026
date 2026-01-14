import mongoose, { Schema, Document } from 'mongoose';

export interface IGuildConfig extends Document {
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
            duration: number; // in seconds
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
        permissions: Map<string, string[]>; // commandName -> roleIds
        cooldowns: Map<string, number>; // commandName -> seconds
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
    createdAt: Date;
    updatedAt: Date;
}

const GuildConfigSchema = new Schema<IGuildConfig>(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        settings: {
            locale: { type: String, default: 'en-US' },
            timezone: { type: String, default: 'UTC' },
        },
        features: {
            moderation: { type: Boolean, default: true },
            logging: { type: Boolean, default: false },
            welcomeMessages: { type: Boolean, default: false },
            autoRoles: { type: Boolean, default: false },
        },
        moderation: {
            modRoles: [{ type: String }],
            adminRoles: [{ type: String }],
            logChannel: { type: String },
            muteRole: { type: String },
            autoTimeout: {
                enabled: { type: Boolean, default: false },
                warnThreshold: { type: Number, default: 3 },
                duration: { type: Number, default: 3600 }, // 1 hour default
            },
        },
        logging: {
            enabled: { type: Boolean, default: false },
            channels: {
                moderation: { type: String },
                messages: { type: String },
                members: { type: String },
            },
            events: {
                messageDelete: { type: Boolean, default: true },
                messageEdit: { type: Boolean, default: true },
                memberJoin: { type: Boolean, default: true },
                memberLeave: { type: Boolean, default: true },
                modActions: { type: Boolean, default: true },
            },
        },
        commands: {
            disabled: [{ type: String }],
            categoryToggles: {
                mod: { type: Boolean, default: true },
                admin: { type: Boolean, default: true },
                utility: { type: Boolean, default: true },
                roles: { type: Boolean, default: true },
            },
            permissions: {
                type: Map,
                of: [String],
                default: new Map(),
            },
            cooldowns: {
                type: Map,
                of: Number,
                default: new Map(),
            },
        },
        welcome: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String },
            message: { type: String },
            dmEnabled: { type: Boolean, default: false },
            dmMessage: { type: String },
        },
        autoRoles: {
            enabled: { type: Boolean, default: false },
            roles: [{ type: String }],
        },
    },
    {
        timestamps: true,
    }
);

// Static method to get or create guild config
GuildConfigSchema.statics.getOrCreate = async function (guildId: string): Promise<IGuildConfig> {
    let config = await this.findOne({ guildId });
    if (!config) {
        config = await this.create({ guildId });
    }
    return config;
};

export const GuildConfig = mongoose.model<IGuildConfig>('GuildConfig', GuildConfigSchema);

import { z } from 'zod';

// Discord ID pattern (snowflake)
const discordIdPattern = /^\d{17,19}$/;
const optionalDiscordId = z.string().regex(discordIdPattern, 'Invalid Discord ID').optional().or(z.literal(''));

// Logging configuration schema
export const loggingSchema = z.object({
    enabled: z.boolean(),
    channels: z.object({
        moderation: optionalDiscordId,
        messages: optionalDiscordId,
        members: optionalDiscordId,
    }),
    events: z.object({
        messageDelete: z.boolean(),
        messageEdit: z.boolean(),
        memberJoin: z.boolean(),
        memberLeave: z.boolean(),
        modActions: z.boolean(),
    }),
});

export type LoggingConfig = z.infer<typeof loggingSchema>;

// Moderation configuration schema
export const moderationSchema = z.object({
    modRoles: z.array(z.string().regex(discordIdPattern, 'Invalid role ID')).max(10, 'Maximum 10 mod roles'),
    adminRoles: z.array(z.string().regex(discordIdPattern, 'Invalid role ID')).max(5, 'Maximum 5 admin roles'),
    logChannel: optionalDiscordId,
    muteRole: optionalDiscordId,
    autoTimeout: z.object({
        enabled: z.boolean(),
        warnThreshold: z.number().min(1, 'Minimum 1').max(10, 'Maximum 10'),
        duration: z.number().min(60, 'Minimum 60 seconds').max(604800, 'Maximum 7 days'),
    }),
});

export type ModerationConfig = z.infer<typeof moderationSchema>;

// Commands configuration schema
export const commandsSchema = z.object({
    disabled: z.array(z.string()),
    categoryToggles: z.object({
        mod: z.boolean(),
        admin: z.boolean(),
        utility: z.boolean(),
        roles: z.boolean(),
    }),
    permissions: z.record(z.array(z.string())),
    cooldowns: z.record(z.number().min(0).max(3600)),
});

export type CommandsConfig = z.infer<typeof commandsSchema>;

// Welcome configuration schema  
export const welcomeSchema = z.object({
    enabled: z.boolean(),
    channelId: optionalDiscordId,
    message: z.string().max(2000, 'Maximum 2000 characters').optional(),
    dmEnabled: z.boolean(),
    dmMessage: z.string().max(2000, 'Maximum 2000 characters').optional(),
});

export type WelcomeConfig = z.infer<typeof welcomeSchema>;

// AutoRoles configuration schema
export const autoRolesSchema = z.object({
    enabled: z.boolean(),
    roles: z.array(z.string().regex(discordIdPattern, 'Invalid role ID')).max(10, 'Maximum 10 auto-roles'),
});

export type AutoRolesConfig = z.infer<typeof autoRolesSchema>;

// Features schema
export const featuresSchema = z.object({
    moderation: z.boolean(),
    logging: z.boolean(),
    welcomeMessages: z.boolean(),
    autoRoles: z.boolean(),
});

export type FeaturesConfig = z.infer<typeof featuresSchema>;

// Default values
export const loggingDefaults: LoggingConfig = {
    enabled: false,
    channels: {
        moderation: '',
        messages: '',
        members: '',
    },
    events: {
        messageDelete: true,
        messageEdit: true,
        memberJoin: true,
        memberLeave: true,
        modActions: true,
    },
};

export const moderationDefaults: ModerationConfig = {
    modRoles: [],
    adminRoles: [],
    logChannel: '',
    muteRole: '',
    autoTimeout: {
        enabled: false,
        warnThreshold: 3,
        duration: 3600,
    },
};

export const featuresDefaults: FeaturesConfig = {
    moderation: true,
    logging: false,
    welcomeMessages: false,
    autoRoles: false,
};

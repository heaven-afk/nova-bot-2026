import { Router, Response } from 'express';
import { z } from 'zod';
import { GuildConfig } from '../models/Guild.js';
import { AuditLog } from '../models/AuditLog.js';
import { authMiddleware, requireGuildAccess, AuthRequest, internalAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { configLimiter, internalLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Validation schemas
export const _guildIdSchema = z.object({
    guildId: z.string().regex(/^\d{17,19}$/, 'Invalid guild ID'),
});

const updateConfigSchema = z.object({
    settings: z
        .object({
            locale: z.string().optional(),
            timezone: z.string().optional(),
        })
        .optional(),
    features: z
        .object({
            moderation: z.boolean().optional(),
            logging: z.boolean().optional(),
            welcomeMessages: z.boolean().optional(),
            autoRoles: z.boolean().optional(),
        })
        .optional(),
    moderation: z
        .object({
            modRoles: z.array(z.string()).optional(),
            adminRoles: z.array(z.string()).optional(),
            logChannel: z.string().nullable().optional(),
            muteRole: z.string().nullable().optional(),
            autoTimeout: z
                .object({
                    enabled: z.boolean().optional(),
                    warnThreshold: z.number().min(1).max(10).optional(),
                    duration: z.number().min(60).max(604800).optional(), // 1 min to 1 week
                })
                .optional(),
        })
        .optional(),
    logging: z
        .object({
            enabled: z.boolean().optional(),
            channels: z
                .object({
                    moderation: z.string().nullable().optional(),
                    messages: z.string().nullable().optional(),
                    members: z.string().nullable().optional(),
                })
                .optional(),
            events: z
                .object({
                    messageDelete: z.boolean().optional(),
                    messageEdit: z.boolean().optional(),
                    memberJoin: z.boolean().optional(),
                    memberLeave: z.boolean().optional(),
                    modActions: z.boolean().optional(),
                })
                .optional(),
        })
        .optional(),
    commands: z
        .object({
            disabled: z.array(z.string()).optional(),
            categoryToggles: z
                .object({
                    mod: z.boolean().optional(),
                    admin: z.boolean().optional(),
                    utility: z.boolean().optional(),
                    roles: z.boolean().optional(),
                })
                .optional(),
            permissions: z.record(z.array(z.string())).optional(),
            cooldowns: z.record(z.number().min(0).max(3600)).optional(),
        })
        .optional(),
    welcome: z
        .object({
            enabled: z.boolean().optional(),
            channelId: z.string().nullable().optional(),
            message: z.string().max(2000).nullable().optional(),
            dmEnabled: z.boolean().optional(),
            dmMessage: z.string().max(2000).nullable().optional(),
        })
        .optional(),
    autoRoles: z
        .object({
            enabled: z.boolean().optional(),
            roles: z.array(z.string()).optional(),
        })
        .optional(),
});

// ==================== Dashboard Routes (Auth Required) ====================

// Get guild config
router.get(
    '/:guildId',
    authMiddleware,
    requireGuildAccess,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const config = await (GuildConfig as any).getOrCreate(guildId);
            res.json(config);
        } catch (error) {
            console.error('Error fetching guild config:', error);
            res.status(500).json({ error: 'Failed to fetch guild configuration' });
        }
    }
);

// Update guild config
router.patch(
    '/:guildId',
    authMiddleware,
    requireGuildAccess,
    configLimiter,
    validate(updateConfigSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const updates = req.body;
            const user = req.user!;

            // Get current config for audit logging
            const currentConfig = await (GuildConfig as any).getOrCreate(guildId);
            const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

            // Deep merge updates
            const updatePaths: Record<string, unknown> = {};

            function flattenUpdates(obj: Record<string, unknown>, prefix = '') {
                for (const [key, value] of Object.entries(obj)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                        flattenUpdates(value as Record<string, unknown>, path);
                    } else {
                        updatePaths[path] = value;

                        // Track changes for audit log
                        const oldValue = path.split('.').reduce((o: any, k) => o?.[k], currentConfig.toObject());
                        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
                            changes.push({ field: path, oldValue, newValue: value });
                        }
                    }
                }
            }

            flattenUpdates(updates);

            // Update config
            const updatedConfig = await GuildConfig.findOneAndUpdate(
                { guildId },
                { $set: updatePaths },
                { new: true }
            );

            // Create audit log
            if (changes.length > 0) {
                await AuditLog.create({
                    guildId,
                    userId: user.id,
                    userTag: `${user.username}#${user.discriminator}`,
                    action: 'CONFIG_UPDATE',
                    target: 'guild_config',
                    changes,
                });
            }

            res.json(updatedConfig);
        } catch (error) {
            console.error('Error updating guild config:', error);
            res.status(500).json({ error: 'Failed to update guild configuration' });
        }
    }
);

// Get audit logs
router.get(
    '/:guildId/audit',
    authMiddleware,
    requireGuildAccess,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
            const skip = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                AuditLog.find({ guildId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                AuditLog.countDocuments({ guildId }),
            ]);

            res.json({
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    }
);

// ==================== Internal Bot Routes (API Key Required) ====================

// Get guild config (for bot)
router.get(
    '/internal/:guildId',
    internalAuthMiddleware,
    internalLimiter,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const config = await (GuildConfig as any).getOrCreate(guildId);
            res.json(config);
        } catch (error) {
            console.error('Error fetching guild config (internal):', error);
            res.status(500).json({ error: 'Failed to fetch guild configuration' });
        }
    }
);

// Check if guild exists (for bot to know if we're managing it)
router.get(
    '/internal/:guildId/exists',
    internalAuthMiddleware,
    internalLimiter,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const config = await GuildConfig.exists({ guildId });
            res.json({ exists: !!config });
        } catch (error) {
            console.error('Error checking guild existence:', error);
            res.status(500).json({ error: 'Failed to check guild' });
        }
    }
);

// Create guild config (when bot joins)
router.post(
    '/internal/:guildId',
    internalAuthMiddleware,
    internalLimiter,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const config = await (GuildConfig as any).getOrCreate(guildId);
            res.json(config);
        } catch (error) {
            console.error('Error creating guild config:', error);
            res.status(500).json({ error: 'Failed to create guild configuration' });
        }
    }
);

// Delete guild config (when bot leaves)
router.delete(
    '/internal/:guildId',
    internalAuthMiddleware,
    internalLimiter,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            await GuildConfig.deleteOne({ guildId });
            // Optionally keep audit logs for historical purposes
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting guild config:', error);
            res.status(500).json({ error: 'Failed to delete guild configuration' });
        }
    }
);

export default router;

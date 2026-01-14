import { Router, Response } from 'express';
import { authMiddleware, requireGuildAccess, AuthRequest } from '../middleware/auth.js';
import { GuildConfig } from '../models/Guild.js';
import { AuditLog } from '../models/AuditLog.js';
import { configLimiter } from '../middleware/rateLimit.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation schemas
const updateCommandsSchema = z.object({
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
});

// Get command configuration
router.get(
    '/:guildId',
    authMiddleware,
    requireGuildAccess,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const config = await (GuildConfig as any).getOrCreate(guildId);

            res.json({
                disabled: config.commands.disabled,
                categoryToggles: config.commands.categoryToggles,
                permissions: Object.fromEntries(config.commands.permissions),
                cooldowns: Object.fromEntries(config.commands.cooldowns),
            });
        } catch (error) {
            console.error('Error fetching command config:', error);
            res.status(500).json({ error: 'Failed to fetch command configuration' });
        }
    }
);

// Update command configuration
router.patch(
    '/:guildId',
    authMiddleware,
    requireGuildAccess,
    configLimiter,
    validate(updateCommandsSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId } = req.params;
            const updates = req.body;
            const user = req.user!;

            const currentConfig = await (GuildConfig as any).getOrCreate(guildId);
            const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

            const updatePaths: Record<string, unknown> = {};

            if (updates.disabled !== undefined) {
                updatePaths['commands.disabled'] = updates.disabled;
                changes.push({
                    field: 'commands.disabled',
                    oldValue: currentConfig.commands.disabled,
                    newValue: updates.disabled,
                });
            }

            if (updates.categoryToggles) {
                for (const [key, value] of Object.entries(updates.categoryToggles)) {
                    updatePaths[`commands.categoryToggles.${key}`] = value;
                    const oldValue = currentConfig.commands.categoryToggles[key as keyof typeof currentConfig.commands.categoryToggles];
                    if (oldValue !== value) {
                        changes.push({
                            field: `commands.categoryToggles.${key}`,
                            oldValue,
                            newValue: value,
                        });
                    }
                }
            }

            if (updates.permissions) {
                updatePaths['commands.permissions'] = new Map(Object.entries(updates.permissions));
                changes.push({
                    field: 'commands.permissions',
                    oldValue: Object.fromEntries(currentConfig.commands.permissions),
                    newValue: updates.permissions,
                });
            }

            if (updates.cooldowns) {
                updatePaths['commands.cooldowns'] = new Map(Object.entries(updates.cooldowns));
                changes.push({
                    field: 'commands.cooldowns',
                    oldValue: Object.fromEntries(currentConfig.commands.cooldowns),
                    newValue: updates.cooldowns,
                });
            }

            const updatedConfig = await GuildConfig.findOneAndUpdate(
                { guildId },
                { $set: updatePaths },
                { new: true }
            );

            if (changes.length > 0) {
                await AuditLog.create({
                    guildId,
                    userId: user.id,
                    userTag: `${user.username}#${user.discriminator}`,
                    action: 'COMMAND_TOGGLE',
                    target: 'commands',
                    changes,
                });
            }

            res.json({
                disabled: updatedConfig!.commands.disabled,
                categoryToggles: updatedConfig!.commands.categoryToggles,
                permissions: Object.fromEntries(updatedConfig!.commands.permissions),
                cooldowns: Object.fromEntries(updatedConfig!.commands.cooldowns),
            });
        } catch (error) {
            console.error('Error updating command config:', error);
            res.status(500).json({ error: 'Failed to update command configuration' });
        }
    }
);

// Toggle specific command
router.post(
    '/:guildId/toggle/:commandName',
    authMiddleware,
    requireGuildAccess,
    configLimiter,
    async (req: AuthRequest, res: Response) => {
        try {
            const { guildId, commandName } = req.params;
            const user = req.user!;

            const config = await (GuildConfig as any).getOrCreate(guildId);
            const disabled = config.commands.disabled as string[];
            const isCurrentlyDisabled = disabled.includes(commandName);

            let updatedDisabled: string[];
            if (isCurrentlyDisabled) {
                updatedDisabled = disabled.filter((c: string) => c !== commandName);
            } else {
                updatedDisabled = [...disabled, commandName];
            }

            await GuildConfig.updateOne(
                { guildId },
                { $set: { 'commands.disabled': updatedDisabled } }
            );

            await AuditLog.create({
                guildId,
                userId: user.id,
                userTag: `${user.username}#${user.discriminator}`,
                action: 'COMMAND_TOGGLE',
                target: commandName,
                changes: [
                    {
                        field: 'enabled',
                        oldValue: !isCurrentlyDisabled,
                        newValue: isCurrentlyDisabled,
                    },
                ],
            });

            res.json({
                command: commandName,
                enabled: isCurrentlyDisabled, // It was disabled, now it's enabled
            });
        } catch (error) {
            console.error('Error toggling command:', error);
            res.status(500).json({ error: 'Failed to toggle command' });
        }
    }
);

export default router;

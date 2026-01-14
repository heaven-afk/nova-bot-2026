import { Router, Response } from 'express';
import { z } from 'zod';
import { Warning } from '../models/Warning.js';
import { GuildConfig } from '../models/Guild.js';
import { internalAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { internalLimiter } from '../middleware/rateLimit.js';

const router = Router();

// All moderation routes are internal (bot -> backend)
router.use(internalAuthMiddleware, internalLimiter);

// Validation schemas
const createWarningSchema = z.object({
    userId: z.string().regex(/^\d{17,19}$/),
    userTag: z.string(),
    modId: z.string().regex(/^\d{17,19}$/),
    modTag: z.string(),
    reason: z.string().max(1000),
});

export const _userIdParamSchema = z.object({
    userId: z.string().regex(/^\d{17,19}$/),
});

// Create warning
router.post('/:guildId/warnings', validate(createWarningSchema), async (req, res: Response) => {
    try {
        const { guildId } = req.params;
        const { userId, userTag, modId, modTag, reason } = req.body;

        const warning = await Warning.create({
            guildId,
            userId,
            userTag,
            modId,
            modTag,
            reason,
        });

        // Check if auto-timeout should trigger
        const config = await (GuildConfig as any).getOrCreate(guildId);
        let shouldTimeout = false;
        let timeoutDuration = 0;

        if (config.moderation.autoTimeout.enabled) {
            const warningCount = await Warning.countDocuments({ guildId, userId });
            if (warningCount >= config.moderation.autoTimeout.warnThreshold) {
                shouldTimeout = true;
                timeoutDuration = config.moderation.autoTimeout.duration;
            }
        }

        res.json({
            warning,
            autoTimeout: shouldTimeout
                ? { trigger: true, duration: timeoutDuration }
                : { trigger: false },
        });
    } catch (error) {
        console.error('Error creating warning:', error);
        res.status(500).json({ error: 'Failed to create warning' });
    }
});

// Get user warnings
router.get('/:guildId/warnings/:userId', async (req, res: Response) => {
    try {
        const { guildId, userId } = req.params;
        const warnings = await Warning.find({ guildId, userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ warnings, count: warnings.length });
    } catch (error) {
        console.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Failed to fetch warnings' });
    }
});

// Delete specific warning
router.delete('/:guildId/warnings/:warningId', async (req, res: Response) => {
    try {
        const { guildId, warningId } = req.params;
        const result = await Warning.deleteOne({ _id: warningId, guildId });

        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Warning not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting warning:', error);
        res.status(500).json({ error: 'Failed to delete warning' });
    }
});

// Clear all warnings for a user
router.delete('/:guildId/warnings/user/:userId', async (req, res: Response) => {
    try {
        const { guildId, userId } = req.params;
        const result = await Warning.deleteMany({ guildId, userId });

        res.json({ success: true, deleted: result.deletedCount });
    } catch (error) {
        console.error('Error clearing warnings:', error);
        res.status(500).json({ error: 'Failed to clear warnings' });
    }
});

// Get moderation config (for embed building)
router.get('/:guildId/config', async (req, res: Response) => {
    try {
        const { guildId } = req.params;
        const config = await (GuildConfig as any).getOrCreate(guildId);

        res.json({
            modRoles: config.moderation.modRoles,
            adminRoles: config.moderation.adminRoles,
            logChannel: config.moderation.logChannel,
            muteRole: config.moderation.muteRole,
            autoTimeout: config.moderation.autoTimeout,
        });
    } catch (error) {
        console.error('Error fetching moderation config:', error);
        res.status(500).json({ error: 'Failed to fetch moderation config' });
    }
});

export default router;

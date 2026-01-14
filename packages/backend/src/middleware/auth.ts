import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { guildsCache } from '../lib/store.js';

export interface AuthUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    guilds?: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: string;
    }>;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || '';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Check if user has MANAGE_GUILD permission for the specified guild
export function requireGuildAccess(req: AuthRequest, res: Response, next: NextFunction): void {
    const guildId = req.params.guildId;
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    let guilds = user.guilds;

    // If guilds are not in the user object (JWT), check the cache
    if (!guilds) {
        const cached = guildsCache.get(user.id);
        if (cached && cached.expiresAt > Date.now()) {
            guilds = cached.guilds;
        }
    }

    if (!guilds) {
        res.status(401).json({ error: 'Session info missing. Please login again.' });
        return;
    }

    const guild = guilds.find((g) => g.id === guildId);

    if (!guild) {
        res.status(403).json({ error: 'You do not have access to this guild' });
        return;
    }

    // Check for MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) permission
    const permissions = BigInt(guild.permissions);
    const hasManageGuild = (permissions & BigInt(0x20)) !== BigInt(0);
    const hasAdmin = (permissions & BigInt(0x8)) !== BigInt(0);
    const isOwner = guild.owner;

    if (!hasManageGuild && !hasAdmin && !isOwner) {
        res.status(403).json({ error: 'Insufficient permissions for this guild' });
        return;
    }

    next();
}

// Internal API key auth for bot -> backend communication
export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['x-internal-api-key'];
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey) {
        res.status(500).json({ error: 'Internal API not configured' });
        return;
    }

    if (apiKey !== expectedKey) {
        res.status(401).json({ error: 'Invalid internal API key' });
        return;
    }

    next();
}

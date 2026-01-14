import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authLimiter } from '../middleware/rateLimit.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.BACKEND_URL + '/api/auth/discord/callback';
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

import { guildsCache } from '../lib/store.js';

// In-memory cache moved to lib/store.ts

// Redirect to Discord OAuth
router.get('/discord', authLimiter, (_req: Request, res: Response) => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds',
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// OAuth callback
router.get('/discord/callback', authLimiter, async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
        res.redirect(`${FRONTEND_URL}/login?error=no_code`);
        return;
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
            return;
        }

        const tokens = (await tokenResponse.json()) as { access_token: string };

        // Fetch user info
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
            res.redirect(`${FRONTEND_URL}/login?error=user_fetch_failed`);
            return;
        }

        const user = (await userResponse.json()) as {
            id: string;
            username: string;
            discriminator: string;
            avatar: string | null;
        };

        // Fetch user's guilds
        const guildsResponse = await fetch(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!guildsResponse.ok) {
            res.redirect(`${FRONTEND_URL}/login?error=guilds_fetch_failed`);
            return;
        }

        const guilds = (await guildsResponse.json()) as Array<{
            id: string;
            name: string;
            icon: string | null;
            owner: boolean;
            permissions: string;
        }>;

        // Store guilds in cache (expires in 7 days to match JWT)
        guildsCache.set(user.id, {
            guilds,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        // Create JWT with user info ONLY (no guilds to keep token small)
        const jwtPayload = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
        };

        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${FRONTEND_URL}/login?error=internal`);
    }
});

// Get current user (with guilds from cache)
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    let guilds: Array<{ id: string; name: string; icon: string | null; owner: boolean; permissions: string }> = [];

    if (userId) {
        const cached = guildsCache.get(userId);
        if (cached && cached.expiresAt > Date.now()) {
            guilds = cached.guilds;
        }
    }

    res.json({
        user: {
            ...req.user,
            guilds,
        }
    });
});

// Refresh token (re-fetch guilds)
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
    // In a production app, you'd store the refresh token and use it here
    // For now, just return the current user info
    res.json({ user: req.user });
});

// Logout (client-side token deletion, but we can log it)
router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response) => {
    // In production with refresh tokens, you'd invalidate the refresh token here
    res.json({ success: true });
});

export default router;

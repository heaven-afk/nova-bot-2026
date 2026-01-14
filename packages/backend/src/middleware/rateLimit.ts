import rateLimit from 'express-rate-limit';

// General API rate limit
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth endpoints rate limit (stricter)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    message: { error: 'Too many authentication attempts' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Config update rate limit
export const configLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 updates per minute
    message: { error: 'Too many configuration updates' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Internal API rate limit (bot -> backend, higher limits)
export const internalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute
    message: { error: 'Internal rate limit exceeded' },
    standardHeaders: true,
    legacyHeaders: false,
});

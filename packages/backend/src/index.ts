import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { authRouter, guildsRouter, commandsRouter, moderationRouter } from './routes/index.js';
import { generalLimiter } from './middleware/rateLimit.js';

const app = express();
// Railway provides PORT env var, fallback to BACKEND_PORT for local dev
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nova-bot';

let dbConnected = false;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

// Health check - Railway checks root /health
// Must respond even before MongoDB connects!
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'connecting'
    });
});

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbConnected ? 'connected' : 'connecting',
    });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/guilds', guildsRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/moderation', moderationRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server FIRST, then connect to database
// This ensures healthcheck passes while DB is connecting
app.listen(PORT, () => {
    console.log(`✓ Backend API running on port ${PORT}`);

    // Connect to MongoDB in the background
    mongoose.connect(MONGODB_URI)
        .then(() => {
            dbConnected = true;
            console.log('✓ Connected to MongoDB');
        })
        .catch((error) => {
            console.error('Failed to connect to MongoDB:', error);
            // Don't exit - let the healthcheck pass and log errors
        });
});

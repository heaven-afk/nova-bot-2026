# Nova Bot 2026

A modular, scalable Discord bot platform with dashboard control.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Dashboard    │────▶│    Backend      │◀────│     Bot         │
│   (Next.js)     │     │   (Express)     │     │  (discord.js)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │    MongoDB      │
                        └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB
- Discord Bot Token & OAuth2 credentials

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the services:**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Bot
   npm run dev:bot

   # Terminal 3 - Dashboard
   npm run dev:dashboard
   ```

4. **Register slash commands (first time only):**
   ```bash
   npm run register -w @nova/bot
   ```

## Project Structure

```
packages/
├── bot/           # Discord bot (discord.js v14)
│   └── src/
│       ├── commands/  # Slash commands by category
│       ├── events/    # Discord event handlers
│       ├── handlers/  # Command & event loaders
│       └── lib/       # Utilities (api, cache, logger)
│
├── backend/       # REST API (Express)
│   └── src/
│       ├── models/     # MongoDB schemas
│       ├── routes/     # API endpoints
│       └── middleware/ # Auth, validation, rate limiting
│
└── dashboard/     # Web UI (Next.js 14)
    └── src/
        ├── app/       # App router pages
        └── lib/       # API client, auth context
```

## Features

### Bot Commands
| Category | Commands |
|----------|----------|
| `/mod` | warn, timeout, kick, ban, purge, warnings |
| `/admin` | config |
| `/utility` | ping, serverinfo, userinfo, help |
| `/roles` | role add/remove |

### Dashboard Pages
- **Guild Selector** - Choose server to manage
- **General Settings** - Feature toggles
- **Moderation** - Auto-timeout, mod roles
- **Commands** - Enable/disable commands & categories
- **Logging** - Configure log events
- **Audit Log** - View config changes

### Core Systems
- ✅ Per-guild configuration (MongoDB)
- ✅ Config caching with TTL
- ✅ Discord OAuth2 authentication
- ✅ Role-based permissions
- ✅ Command cooldowns
- ✅ Moderation logging (embeds)
- ✅ Auto-timeout on warning threshold
- ✅ Audit logging for dashboard changes

## Environment Variables

```env
# Discord
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nova-bot

# Backend
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
JWT_SECRET=your_32_char_secret
INTERNAL_API_KEY=your_internal_key
FRONTEND_URL=http://localhost:3000

# Dashboard
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_client_id
```

## API Endpoints

### Auth
- `GET /api/auth/discord` - OAuth redirect
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/me` - Get current user

### Guilds
- `GET /api/guilds/:guildId` - Get config
- `PATCH /api/guilds/:guildId` - Update config
- `GET /api/guilds/:guildId/audit` - Audit logs

### Commands
- `GET /api/commands/:guildId` - Get command config
- `PATCH /api/commands/:guildId` - Update config
- `POST /api/commands/:guildId/toggle/:cmd` - Toggle command

### Internal (Bot → Backend)
- `GET /api/guilds/internal/:guildId` - Get config
- `POST /api/guilds/internal/:guildId` - Create config
- `POST /api/moderation/:guildId/warnings` - Create warning

## Extending the Bot

### Adding Commands
1. Create file in `packages/bot/src/commands/{category}/`
2. Use `createCommand()` helper
3. Restart bot or run register script

### Adding Features
1. Add field to `GuildConfig` schema
2. Create backend route
3. Create dashboard UI
4. Update bot to respect config

## Future Considerations
- Plugin architecture
- Multi-bot support
- Feature flags
- Paid tiers
- Niche bot variants

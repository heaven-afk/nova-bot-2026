# Nova Bot - Render Deployment Guide

## Prerequisites
1. MongoDB Atlas database (free tier works)
2. Render account (render.com)
3. Vercel account (for dashboard)
4. Discord Bot Token (from Discord Developer Portal)

---

## Step 1: Set Up MongoDB Atlas

If you haven't already:
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user (username + password)
4. Get your connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nova-bot`
5. Whitelist all IPs: `0.0.0.0/0` (for Render)

---

## Step 2: Deploy Backend to Render

### 2.1 Create `render.yaml` in repo root (already created)

### 2.2 Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2.3 Create Web Service on Render
1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `nova-bot-backend`
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2.4 Add Environment Variables on Render
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `INTERNAL_API_KEY` | Generate: `openssl rand -base64 32` |
| `DISCORD_CLIENT_ID` | Your Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Your Discord Client Secret |
| `FRONTEND_URL` | `https://nova-bot-2026-dashboard.vercel.app` |
| `BACKEND_URL` | `https://nova-bot-backend.onrender.com` (your Render URL) |
| `NODE_ENV` | `production` |

---

## Step 3: Deploy Bot to Render

### 3.1 Create Another Web Service
1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `nova-bot`
   - **Root Directory**: `packages/bot`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3.2 Add Environment Variables
| Variable | Value |
|----------|-------|
| `DISCORD_TOKEN` | Your Discord Bot Token |
| `BACKEND_URL` | `https://nova-bot-backend.onrender.com` |
| `INTERNAL_API_KEY` | Same as backend |
| `NODE_ENV` | `production` |

---

## Step 4: Update Vercel Dashboard

### 4.1 Update Environment Variables on Vercel
Go to your Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://nova-bot-backend.onrender.com` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Your Discord Client ID |

### 4.2 Redeploy
```bash
git push origin main
```
Or trigger redeploy from Vercel dashboard.

---

## Step 5: Update Discord Developer Portal

1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Go to OAuth2 → General
4. Add Redirects:
   - `https://nova-bot-backend.onrender.com/api/auth/discord/callback`
5. Save

---

## Step 6: Verify Deployment

1. **Backend Health**: Visit `https://nova-bot-backend.onrender.com/health`
2. **Dashboard**: Visit `https://nova-bot-2026-dashboard.vercel.app`
3. **Bot**: Check if bot is online in your Discord server

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify MongoDB connection string
- Make sure all env vars are set

### OAuth login fails
- Verify redirect URI in Discord Developer Portal
- Check BACKEND_URL is correct in Vercel env vars

### Bot not responding
- Check Render logs for bot service
- Verify DISCORD_TOKEN is correct
- Make sure backend is running first

# Nova Bot - Railway Deployment Guide

This guide explains how to deploy the Nova Bot to Railway.app.

## Prerequisites

1.  **Railway Account**: Create one at [railway.app](https://railway.app).
2.  **GitHub Repository**: Ensure your code is pushed to GitHub.
3.  **Discord Bot Token**: From the Discord Developer Portal.
4.  **MongoDB Connection**: You can use Railway's MongoDB plugin or an external provider like MongoDB Atlas.

---

## Deployment Steps

### 1. Create a New Project on Railway

1.  Go to your [Railway Dashboard](https://railway.app/dashboard).
2.  Click **+ New Project**.
3.  Select **Deploy from GitHub repo**.
4.  Select your `nova-bot-2026` repository.
5.  Click **Deploy Now**.

### 2. Configure the Bot Service

By default, Railway might try to deploy the root directory. We need to configure it to build and start the bot specifically.

1.  Click on the newly created service card (it might be named after your repo).
2.  Go to the **Settings** tab.
3.  Scroll down to the **Build** section:
    *   **Build Command**: `npm install && npm run build:bot`
4.  Scroll down to the **Deploy** section:
    *   **Start Command**: `npm run start:bot`
5.  (Optional) **Watch Paths**: `packages/bot/**` (This ensures the bot only rebuilds when bot code changes).

### 3. Set Environment Variables

1.  Go to the **Variables** tab of your service.
2.  Add the following variables (Raw Editor is easiest):

```env
NODE_ENV=production
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
MONGODB_URI=
# If you deployed the backend separately on Railway:
BACKEND_URL=https://your-backend-service.up.railway.app
INTERNAL_API_KEY=your_shared_secret_key
```

### 4. Deploying the Backend (Optional but Recommended)

If your bot relies on the backend API:

1.  In the same project, click **+ New** -> **GitHub Repo**.
2.  Select the same repo again.
3.  Go to **Settings** for this *new* service.
4.  **Service Name**: Change to `backend`.
5.  **Build Command**: `npm install && npm run build:backend`
6.  **Start Command**: `npm run start:backend`
7.  **Variables**: Add `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_API_KEY`, etc.
8.  **Networking**: Railway will generate a domain (e.g., `backend-production.up.railway.app`). Use this as the `BACKEND_URL` for your bot.

---

## Troubleshooting

### Bot Crashes on Start
*   **Check Logs**: Go to the **Deployments** tab and click on the latest log.
*   **"Missing script: start"**: Ensure you are using `npm run start:bot` as the start command.
*   **"DISCORD_TOKEN is not set"**: Double-check your Environment Variables.

### Monorepo Issues
*   If Railway fails to find modules, make sure the **Root Directory** in Settings is left as `/` (the project root), NOT `packages/bot`. We handle the subdirectory logic using the `npm run start:bot` -w workspace flags.

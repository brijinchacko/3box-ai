#!/bin/bash
# ─────────────────────────────────────────────
# jobTED AI — Update Script (zero-downtime)
# Run this to deploy new changes from GitHub
# ─────────────────────────────────────────────

set -e

echo "🔄 jobTED AI — Updating..."
cd /var/www/jobtedai

# Pull latest changes
echo "📦 Pulling latest changes..."
git pull origin main

# Install any new dependencies
echo "📥 Installing dependencies..."
npm ci --production=false

# Rebuild
echo "🔨 Building..."
npx prisma generate
npm run build

# Apply any database migrations
echo "🗄️  Applying database changes..."
npx prisma db push

# Restart app (zero-downtime with PM2)
echo "🚀 Restarting..."
pm2 reload jobted-ai

echo "✅ Update complete!"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs jobted-ai"

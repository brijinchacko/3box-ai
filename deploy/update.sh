#!/bin/bash
# ─────────────────────────────────────────────
# 3BOX AI — Update Script (zero-downtime)
# Run this to deploy new changes from GitHub.
#
# Reflects the ACTUAL VPS layout (matters — earlier values were wrong
# and silently bypassed by manual deploys for months):
#   - source dir is /var/www/3box-ai (with hyphen)
#   - git remote is named "3box" (set up with `git remote add 3box ...`)
#   - npm ci needs --legacy-peer-deps because next-auth@4.24.13 declares
#     peerOptional nodemailer@^7 while we pin nodemailer@^8 (harmless,
#     since we don't use next-auth's email provider)
#   - next build needs ~5–6 GB heap on this codebase; default 2 GB OOMs
#     during the type-check phase and corrupts .next/, taking the site
#     down. NODE_OPTIONS bumps the limit before it's an issue.
# ─────────────────────────────────────────────

# `set -eo pipefail` so a failing step (npm ci, build, prisma) aborts
# BEFORE pm2 reload — the previous build keeps serving traffic until a
# successful build replaces it. Critical: never tee/tail the output of
# the failable steps in a pipeline that swallows the non-zero exit.
set -eo pipefail

APP_DIR="/var/www/3box-ai"
APP_NAME="3box-ai"
GIT_REMOTE="3box"
GIT_BRANCH="main"

echo "🔄 3BOX AI — Updating..."
cd "$APP_DIR"

echo "📦 Pulling latest changes from $GIT_REMOTE/$GIT_BRANCH..."
git pull "$GIT_REMOTE" "$GIT_BRANCH"

echo "📥 Installing dependencies..."
npm ci --production=false --legacy-peer-deps

echo "🔨 Generating Prisma Client..."
npx prisma generate

echo "🔨 Building (with 6 GB heap to survive the type-check phase)..."
NODE_OPTIONS='--max-old-space-size=6144' npm run build

echo "🗄️  Applying database changes (no-op when schema unchanged)..."
npx prisma db push

echo "🚀 Reloading $APP_NAME (zero-downtime via PM2)..."
pm2 reload "$APP_NAME" --update-env

echo "✅ Update complete!"
echo "   Check status: pm2 status"
echo "   View logs:    pm2 logs $APP_NAME"
echo "   Health probe: curl -sS -o /dev/null -w 'HTTP %{http_code}\\n' http://127.0.0.1:3003/"

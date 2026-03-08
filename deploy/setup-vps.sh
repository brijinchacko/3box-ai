#!/bin/bash
# ─────────────────────────────────────────────
# jobTED AI — VPS Setup Script
# VPS: 72.62.230.223 (Hostinger)
# ─────────────────────────────────────────────
# This script sets up jobTED AI alongside existing apps.
# It will NOT affect your other web applications.
# ─────────────────────────────────────────────

set -e

echo "🚀 jobTED AI — VPS Setup Script"
echo "================================"

# ─── Step 1: Create app directory ────────────
echo ""
echo "📁 Step 1: Creating application directory..."
sudo mkdir -p /var/www/jobtedai
sudo chown $USER:$USER /var/www/jobtedai

# ─── Step 2: Clone repository ────────────────
echo ""
echo "📦 Step 2: Cloning repository..."
cd /var/www/jobtedai
git clone https://github.com/brijinchacko/jobted-ai.git .
# If already cloned: git pull origin main

# ─── Step 3: Install dependencies ────────────
echo ""
echo "📥 Step 3: Installing dependencies..."
npm ci --production=false

# ─── Step 4: Setup environment ───────────────
echo ""
echo "🔧 Step 4: Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Please edit .env with your production values:"
  echo "   nano /var/www/jobtedai/.env"
  echo ""
  echo "   Required variables:"
  echo "   - DATABASE_URL (PostgreSQL connection string)"
  echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
  echo "   - NEXTAUTH_URL=https://jobted.ai"
  echo "   - NEXT_PUBLIC_APP_URL=https://jobted.ai"
  echo "   - OPENROUTER_API_KEY"
  echo "   - STRIPE_SECRET_KEY"
  echo "   - STRIPE_WEBHOOK_SECRET"
fi

# ─── Step 5: Build application ───────────────
echo ""
echo "🔨 Step 5: Building application..."
npx prisma generate
npm run build

# ─── Step 6: Database setup ──────────────────
echo ""
echo "🗄️  Step 6: Setting up database..."
npx prisma db push
echo "   Run 'npx tsx prisma/seed.ts' to load demo data (optional)"

# ─── Step 7: Setup Nginx ─────────────────────
echo ""
echo "🌐 Step 7: Setting up Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/jobted.ai
sudo ln -sf /etc/nginx/sites-available/jobted.ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "   ✅ Nginx configured (existing sites untouched)"

# ─── Step 8: SSL Certificate ─────────────────
echo ""
echo "🔒 Step 8: Setting up SSL..."
echo "   Run the following command to get SSL certificate:"
echo "   sudo certbot --nginx -d jobted.ai -d www.jobted.ai"
echo ""
echo "   Or if using Certbot standalone:"
echo "   sudo certbot certonly --webroot -w /var/www/certbot -d jobted.ai -d www.jobted.ai"

# ─── Step 9: Start with PM2 ──────────────────
echo ""
echo "🚀 Step 9: Starting application with PM2..."
sudo mkdir -p /var/log/pm2
pm2 start deploy/ecosystem.config.js --env production
pm2 save
echo "   ✅ jobTED AI running on port 3001"

# ─── Step 10: Setup PM2 startup ──────────────
echo ""
echo "⚡ Step 10: Setting up PM2 startup..."
pm2 startup
echo "   Run the command above if prompted"

echo ""
echo "════════════════════════════════════════════"
echo "✅ jobTED AI deployment complete!"
echo ""
echo "📋 Checklist:"
echo "   [ ] Edit .env with production values"
echo "   [ ] Setup SSL: sudo certbot --nginx -d jobted.ai"
echo "   [ ] Point DNS: jobted.ai → 72.62.230.223"
echo "   [ ] Configure Stripe webhook: https://jobted.ai/api/stripe/webhook"
echo "   [ ] Test: curl https://jobted.ai"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status          — Check app status"
echo "   pm2 logs jobted-ai   — View logs"
echo "   pm2 restart jobted-ai — Restart app"
echo "   pm2 monit           — Monitor resources"
echo "════════════════════════════════════════════"

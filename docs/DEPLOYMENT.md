# 3BOX AI — Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (for queues and caching)
- Stripe account (for billing)
- OpenRouter API key (for AI features)
- S3-compatible storage (for assets/PDFs)

## Option 1: Vercel (Recommended)

### Steps

1. **Push to GitHub**
   ```bash
   git init && git add . && git commit -m "Initial commit"
   gh repo create 3box-ai --private --push
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

4. **Set Up Database**
   - Use Vercel Postgres, Supabase, or Neon for managed PostgreSQL
   - Set `DATABASE_URL` in Vercel env vars
   - Run `npx prisma db push` locally pointing to prod DB

5. **Set Up Redis**
   - Use Upstash Redis (Vercel integration available)
   - Set `REDIS_URL` in Vercel env vars

6. **Configure Stripe Webhooks**
   - In Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`

### Vercel Configuration

```json
// vercel.json (optional)
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "regions": ["iad1"]
}
```

## Option 2: Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://3box:password@db:5432/3box_ai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: 3box
      POSTGRES_PASSWORD: password
      POSTGRES_DB: 3box_ai
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### Deploy

```bash
docker-compose up -d
docker-compose exec app npx prisma db push
docker-compose exec app npx tsx prisma/seed.ts
```

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrated (`prisma db push`)
- [ ] Seed data loaded (`npx tsx prisma/seed.ts`)
- [ ] Stripe webhook configured
- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] Error monitoring set up (Sentry recommended)
- [ ] OFORO internal domains configured
- [ ] Rate limiting tested
- [ ] CORS headers verified
- [ ] Security headers present (X-Frame-Options, etc.)

## Monitoring

### Recommended Stack
- **Error Tracking:** Sentry
- **Logs:** Pino → Axiom/Datadog
- **Uptime:** BetterUptime
- **Analytics:** PostHog (privacy-first)
- **Performance:** Vercel Analytics or Web Vitals

### Key Metrics to Monitor
- API response times (p50, p95, p99)
- AI credit usage per user
- Assessment completion rates
- Resume export success rate
- Job application automation success rate
- Stripe webhook processing
- Queue depth and processing times

## Scaling Considerations

1. **Database:** Use read replicas for heavy read operations
2. **Redis:** Use Redis Cluster for high throughput
3. **AI Calls:** Implement request queuing with BullMQ for burst handling
4. **PDF Generation:** Offload to background workers
5. **CDN:** Use Vercel Edge or CloudFront for static assets
6. **Rate Limiting:** Implement per-user, per-endpoint limits with Redis

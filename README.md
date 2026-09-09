# Memorial Web

Next.js memorial platform for **Let Us Handle Your Funeral**.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Prisma + **PostgreSQL** (Railway)
- Auth.js (credentials)
- Stripe Checkout

## Local setup

```bash
npm install
# Point DATABASE_URL at Railway Postgres (public URL) or a local Postgres
npx prisma migrate deploy
npx tsx prisma/seed.ts   # optional
npm run dev
```

## Railway deploy

### memorial-web service env

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Reference Railway Postgres variable (same plugin as API is fine) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-memorial.up.railway.app` |
| `NEXTAUTH_URL` | same as `AUTH_URL` |
| `AUTH_TRUST_HOST` | `true` |
| `PLATFORM_API_URL` | `https://your-platform-api.up.railway.app` |
| `PLATFORM_API_JWT_SECRET` | Must match `APP_JWT_SECRET` on platform-api |

Start command runs `prisma migrate deploy && next start`.

### platform-api service env

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Railway Postgres plugin (postgresql://…) — auto-mapped to JDBC |
| `APP_JWT_SECRET` | Same value as memorial-web `PLATFORM_API_JWT_SECRET` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-memorial.up.railway.app,https://your-admin.up.railway.app` |
| `PORT` | Set by Railway |

You can share **one** Postgres database: memorial Prisma tables and Spring JPA tables use different names.

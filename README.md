# Memorial Web

Next.js memorial platform for **Let Us Handle Your Funeral** — ForeverMissed-style memorials with plans, guestbook, privacy, and marketplace hooks to `platform-api`.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Prisma + SQLite locally (`DATABASE_URL=file:./dev.db`); switch to Postgres via `docker-compose.yml`
- Auth.js (credentials)
- Stripe Checkout (falls back to instant upgrade when keys are placeholders)

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env

Copy `.env.example` to `.env`. Set Stripe keys for real billing. Set `PLATFORM_API_URL` / `PLATFORM_API_JWT_SECRET` to match `platform-api`.

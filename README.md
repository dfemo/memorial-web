# EverRemember (memorial-web)

Frontend for **EverRemember** — talks to `platform-api` (`/api/v1`).

## Run

```bash
# Terminal 1
cd platform-api
mvn spring-boot:run

# Terminal 2
cd memorial-web
npm install
npm run dev
```

Set `PLATFORM_API_URL` to your API (default `http://localhost:8080`).

Demo user (seeded by API): `family@everremember.local` / `password123`  
Demo memorial: `/memorial/jordan-ellis`

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/create` | Create memorial |
| `/memorial/[slug]` | Public memorial |
| `/browse` | Search/explore |
| `/dashboard` | My memorials |
| `/sign-in` `/sign-up` | Auth via platform-api JWT cookies |

# Pulse - Task Status Tracker (MVP)

A minimal full-stack TypeScript status tracker built with Nuxt 4, Nuxt UI, Vue Query, and Cloudflare D1.

## Stack

- Nuxt 4 + Nuxt UI
- Vue Query (`@tanstack/vue-query`)
- Cloudflare Workers runtime via Wrangler
- Cloudflare D1 for persistence
- Playwright for end-to-end tests

## Local setup

```bash
npm install
```

Default seeded admin for local development:

- Username: `admin`
- Password: `admin123`

## Database migrations

Apply local D1 migrations:

```bash
npm run db:migrate:local
```

Reset local D1 state and re-apply migrations:

```bash
npm run db:reset:local
```

## Development (Wrangler local emulation)

```bash
npm run dev
```

The app runs through Wrangler with Cloudflare local emulation on port `8787`.

## API

### PUT `/api/status`

- Auth: `Authorization: Bearer <api-token>`
- Body must contain only:

```json
{ "status": "started" }
```

Allowed statuses:

- `started`
- `stopped`
- `error`

Status updates are append-only and stored in `status_events`.

## Scripts

- `npm run dev` - migrate local DB, build for Cloudflare, run Wrangler locally
- `npm run dev:test` - build and run Wrangler test server on port 8788
- `npm run build` - Nuxt production build for Cloudflare
- `npm run lint` - ESLint
- `npm run typecheck` - Nuxt TypeScript checks
- `npm run test` - Playwright end-to-end tests

## Playwright tests

```bash
npm run test
```

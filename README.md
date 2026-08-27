# kio.lol — Bio Link Profile Builder

A modern Guns.lol-inspired bio-link profile builder with authentication, a customizable dashboard, public profiles, templates, analytics, Discord integration, widgets, visual effects, badges, and live preview.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, framer-motion, lucide-react, react-easy-crop
- **Backend:** Express 5, SQLite (better-sqlite3), JWT, Multer, sharp, discord.js, nodemailer, helmet, express-rate-limit

## Deployment

### Option A — Render (monolith, default)

Frontend and backend are served from the same Express server. Render builds with `npm install && npm run build` and serves both the static `dist/` and the `/api` + `/uploads` routes.

- **Service:** Web Service, Node, Free plan, blueprint from `render.yaml`, branch `master`
- **Live:** `https://kio-lol.onrender.com`
- **Note (free tier):** SQLite DB resets on each deploy; there is no persistent disk.

### Option B — Static frontend on Vercel + backend on Render (static split)

To serve the frontend only on Vercel while keeping the API on Render:

1. Keep the backend deployed on Render (as in Option A). CORS is already fully open (`app.use(cors())`), so any origin can call the API. JWT auth is sent via the `Authorization` header (not cookies), so no credentials/CORS-preflight cookie flags are needed.
2. In Vercel, create a project for this repo and set the build-time environment variable:
   - `VITE_API_URL = https://kio-lol.onrender.com`
   - Vercel builds with `npm install && npm run build` (already the configured script) and outputs `dist/`.
   - `vercel.json` rewrites all non-`/api`, non-`/uploads` paths to `index.html` for SPA routing.
3. The frontend resolves relative `/uploads/...` asset URLs (avatars, banners, backgrounds, music) to the backend via the `assetUrl()` helper in `src/lib/utils.ts`, which reads the same `VITE_API_URL`.

> When `VITE_API_URL` is empty (the default), the app stays same-origin and works exactly as the Render monolith. Set it only when splitting the frontend to a separate host.

## Environment Variables

See `.env.example`. Key variables:

- `JWT_SECRET` — signing secret for auth tokens
- `VITE_API_URL` — (frontend build-time) absolute backend URL; empty = same-origin
- `APP_URL` — canonical site URL
- `SMTP_*` — email transport (nodemailer)
- `DISCORD_BOT_TOKEN` — Discord bot token for presence
- `CAPTCHA_SECRET` — HMAC secret for captcha answers

## Local Development

```bash
npm install
npm run dev        # Vite dev server on :5173, proxies /api and /uploads to :3001
npm run dev:server # Express backend on :3001
npm run build
```

@AGENTS.md

# ClashSync

Web app for Clash of Clans players: paste the in-game **Export Village** JSON → see every active upgrade (builders, lab, pet house, builder base) with exact finish times → (planned) Builder Potion adjustments and Discord alerts when timers finish.

Product scope and the original plan: `docs/PROJECT_OVERVIEW.md`. `CONTEXT.md` is the planning-era guide; **where it disagrees with this file or the code, the code wins** (it predates the real schema and stack choices).

## Commands

Package manager is **pnpm** (`packageManager: pnpm@12.5.1`). Do not use npm/yarn.

- `pnpm dev` — dev server (Turbopack) on http://localhost:3000
- `pnpm build` / `pnpm start`
- `pnpm lint` — ESLint 9 flat config (`eslint.config.mjs`)
- `pnpm test` / `pnpm test:watch` — Vitest (`vitest.config.mts`, `@/` alias set up). Tests sit next to the code as `*.test.ts`; they cover the pure modules (`parser`, `boosts`, `tags`). No DB or route tests yet.
- Schema changes: edit `lib/db/schema.ts` → `pnpm db:generate --name <change>` → review the SQL in `drizzle/` → `pnpm db:migrate`. Commit the `drizzle/` folder. Don't use `drizzle-kit push` any more (it bypasses the history).
- `pnpm db:baseline` — one-off for a database created with `push`: records `0000_baseline` as applied so `db:migrate` doesn't re-create existing tables. Idempotent.

## Stack (as built)

- **Next.js 16.4** App Router, React 19.3, TypeScript. `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md). Route handler `params` is a **Promise** (`await params`).
- **Tailwind CSS v4**, loaded through the `@tailwindcss/turbopack` loader configured in `next.config.ts`. **shadcn/ui is not installed**, despite what the docs say. The UI uses hand-written Tailwind plus `lucide-react` icons, with a dark, game-style look.
- **Neon serverless Postgres + Drizzle ORM** (`drizzle-orm/neon-http`). The `neon-http` driver does **not** support interactive transactions, so multi-step writes use `db.batch([...])` (runs atomically). Generate ids up front (`crypto.randomUUID()`) so later statements in the batch can reference them.
- Path alias `@/*` → repo root.

## Layout

```
app/
  page.tsx                      "use client" home page: state + handlers for the JSON paste tab, tag lookup tab and results
  _home/                        Presentational pieces of the home page (export-tab, tag-lookup-tab, notices, upgrade-results, site-header)
  api/village/sync/route.ts     POST {rawJson, playerTag?} → parse, upsert user by tag, CANCEL old ACTIVE upgrades, insert new (one db.batch)
  api/village/upgrades/route.ts GET ?tag= → ACTIVE upgrades for that tag, remaining time recomputed from now
  api/player/[tag]/route.ts     GET → official Supercell API profile (lib/clash-api.ts)
  api/village/claim/route.ts    POST {tag, token} → API-token takeover: moves the village to the logged-in account (login required)
  api/village/notifications/route.ts  PUT webhook · PATCH {dm} DM alerts · POST test · DELETE webhook (owner only)
  api/auth/[...all]/route.ts    Better Auth handler (Discord OAuth, sessions)
  api/account/after-login/route.ts  Post-login step: link legacy cookie villages, bot adds user to the Discord server
  villages/                     "My villages" list for the logged-in account
  _components/account-menu.tsx  Login button / avatar + log out (client, uses lib/auth-client)
  api/cron/notify/route.ts      QStash-signed sweep → Discord alerts (lib/notify.ts, lib/discord.ts)
  api/village/boosts/route.ts   POST {tag, kind} apply potion · DELETE {tag} undo latest. Writes via db.batch (atomic)
  v/[tag]/                      Live dashboard (server page streams DB data behind <Suspense>; client ticks timers)
lib/
  parser.ts        parseVillageExport(rawJson) → ParseResult; formatDuration(). Pure, runs client AND server side
  clash-data.ts    CLASH_ENTITIES: numeric data ID → {name, category}; resolveEntity() fallback heuristics by section
  types.ts         Raw export shapes (RawExportVillage / RawVillageItem) + ActiveUpgrade / ParseResult
  clash-api.ts     fetchPlayerProfile / verifyPlayerToken. Always via RoyaleAPI proxy (cocproxy.royaleapi.dev), so
                   CLASH_API_KEY whitelists the proxy IP and works locally + on Vercel. CLASH_API_MOCK=1 fakes both in dev (never in prod)
  db/schema.ts     Drizzle tables: users, upgrades
  db/index.ts      db client; forces IPv4-first DNS; falls back to loading .env.local itself
  sample-data.ts   SAMPLE_VILLAGE_JSON for demos
  tags.ts          normalizeTag() (uppercase, O→0, validates charset) / tagToSlug() — use for every tag input
  auth.ts          Better Auth server config (Discord, auth_* tables, cookie cache) + getSessionUser()
  auth-client.ts   Browser auth client + signInWithDiscord(next)
  ownership.ts     getVillageAccess(): who may edit a village; reads the legacy `cs_owner` cookie for migration only
  app-url.ts       appUrl(): public base URL (links in messages, auth baseURL)
  village.ts       getVillage(tag) — server data access for the dashboard
  boosts.ts        Potion specs + pure timing math (boostedFinishTime, nextBoostWindow); shared by parser, API and UI
```

## Domain rules (important)

- **Export format:** top-level `tag`, `timestamp` (Unix seconds) and arrays `buildings`, `heroes`, `units`, `spells`, `pets`, `traps`, plus builder-base twins with a `2` suffix (`buildings2`, `heroes2`, `units2`, `traps2`). An item is an active upgrade when `timer > 0`. `timer` is the number of seconds left **at export time**. `data` is the entity ID, `lvl` is the current level (target = `lvl + 1`), `gear_up` marks a gear-up, and `extra` marks the goblin builder or an extra slot.
- **Time math:** `finish = exportTimestamp + timer`, all in **UTC Unix seconds** (not ms). If `timestamp` is missing or bogus, the parser falls back to "now". Store epochs; format only for display.
- **Categories:** `BUILDER | LABORATORY | PET_HOUSE | BUILDER_BASE | OTHER`. Heroes count as `BUILDER` (home) and `BUILDER_BASE` (BB). `units` and `spells` count as `LABORATORY`, and `pets` as `PET_HOUSE`. Unknown IDs go through `resolveEntity` heuristics, so add new IDs to `CLASH_ENTITIES` when they show up.
- **`originalFinishTime` vs `currentFinishTime`:** the two are equal at sync. Only `currentFinishTime` should change (for example, from a potion). `originalFinishTime` keeps the time from the export.
- **Sync semantics:** a sync never deletes rows. Previous `ACTIVE` upgrades for the user are set to `CANCELLED`, and fresh rows are inserted. Statuses are `ACTIVE | COMPLETED | CANCELLED`, stored as plain `text` (not a pg enum).
- **Identity:** users are keyed by **player tag** (stored as `#XXXX`; URLs use the bare slug). Always pass tags through `normalizeTag`. A sync without a valid tag is rejected.
- **Accounts vs villages:** people log in with Discord (Better Auth, tables `auth_user/auth_session/auth_account/auth_verification`, mapped via `modelName` in `lib/auth.ts`). The old `users` table is one row per **village**; `users.owner_id` links it to an `auth_user`. Discord user id = `auth_account.account_id` where `provider_id = 'discord'`.
- **Ownership (`getVillageAccess`):** claimed village → only the owner account may sync/potion/alerts. Unclaimed → anyone; a **logged-in sync claims it** (no token). Unclaimed but verified the old way → only browsers with the legacy `cs_owner` cookie; logging in links it. The **API token always wins**: `/api/village/claim` moves the village to the caller and clears the previous owner's alerts. Use `accessDeniedMessage()` for 403s.
- **Dashboard timing:** the server never computes "now". `useNow()` returns `null` during SSR/hydration so markup matches, then ticks every second on the client. Builder totals come from the Builder's Hut `cnt` (`users.builder_count`), which isn't always in the export, so the UI falls back to "N busy / next free in…". Goblin and extra slots don't count as busy.

## Roadmap / not built yet

Done: Phase 1 (parser + upgrades UI), Phase 2 (Neon/Drizzle persistence, sync API, Supercell player lookup), Phase 4 (`/v/[tag]` live dashboard, stale-export warning, idle builder/lab/pet status, API-token ownership). Phase 3 done (done after Phase 6): Vitest for the pure modules, atomic `db.batch` sync, a committed `drizzle/` migration history starting at `0000_baseline`, and `app/page.tsx` split into `app/_home/`.

Phase 5 done: Builder Potion (10× for 1h, ≤9h saved) and Research Potion (24× for 1h, ≤23h saved). Only `currentFinishTime` changes. Potions stack: the next one starts at `users.*_boost_ends_at`. Each potion is logged in `boosts` with the finish times it changed. Only the latest `APPLIED` one can be undone, and only if those times are unchanged. A re-sync marks earlier boosts `SUPERSEDED`. The export's `boosts.builder_boost` is applied at parse time. The export has no known research-boost field, so a running Research Potion is lost on re-sync.

Phase 6 done: Discord alerts.
- Verified owners save a Discord **webhook URL** on the dashboard (`/api/village/notifications`: PUT save, which sends a confirmation first, POST test, DELETE off). The URL is validated as a Discord webhook (SSRF guard) and never sent to the client (`webhookAlerts` only).
- **Early alerts:** each village picks a lead time (`users.alert_lead_minutes`, default 5; 0 = when done). The sweep claims upgrades finishing by `now + lead + 2 min`, so alerts land `lead`–`lead+2` min before the finish (`lib/alerts.ts`, `SWEEP_INTERVAL_SECONDS` must match the cron). Messages use Discord `<t:…:R>` timestamps (live countdown, reader timezone). A re-sync carries `notified_at` over to matching new rows (`carryOverNotified`) so players aren't alerted twice.
- **One QStash schedule** (`pnpm qstash:schedule <public-url>`, id `clashsync-notify`, every 2 min) POSTs to `/api/cron/notify`. That endpoint verifies `upstash-signature`; unsigned requests are allowed only in dev. Per-upgrade QStash messages were deliberately not used, so `upgrades.qstash_message_id` is unused.
- The sweep (`lib/notify.ts`) claims due rows with one `UPDATE … WHERE notified_at IS NULL RETURNING`, which prevents double sends, then sends one message per village. Upgrades finished more than 30 min ago are skipped. 429/5xx failures release the claim for retry. Undoing a potion re-arms the alert (clears `notified_at`).
- Status stays `ACTIVE` after notifying (the dashboard shows "Done"). `COMPLETED` is still unused.

Phase 7 done: Discord login (self-hosted Better Auth), account-owned villages (claim on sync, API-token takeover), "My villages", and bot DM alerts. Login requests `guilds.join`; after login the bot adds the user to the ClashSync server (`DISCORD_GUILD_ID`) because bots can only DM people they share a server with. `users.dm_alerts` turns DMs on (PATCH sends a confirmation DM first). The sweep sends to the webhook and/or DM; it only retries when nothing got through. DM UI is hidden unless `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` are set.

Still to build:
- Remove the legacy `cs_owner` cookie path once old owners have logged in.
- Rename the `users` table to `villages` (it predates accounts).
- Tests for the API routes and `lib/notify.ts` (they need a DB or mocks).

## Conventions

- Env: copy `.env.example` → `.env.local`. All `.env*` except `.env.example` are gitignored. Use the **pooled** Neon connection string.
- API responses use the shape `{ success: boolean, error?: string, ... }`, with errors caught and returned as JSON (400 for bad input, 404 when not found, 500 for DB errors).
- User-facing copy should be player-friendly, not backend jargon. A recent commit replaced technical wording on purpose.
- Keep `lib/parser.ts` free of server-only imports, because the client page imports it directly.
- Commits use conventional style (`feat(scope):`, `fix:`, `chore:`, `style(ux):`, `docs:`).

@AGENTS.md

# ClashSync

Web app for Clash of Clans players: paste the in-game **Export Village** JSON → see every active upgrade (builders, lab, pet house, builder base) with exact finish times → apply Builder/Research Potions → get Discord alerts (webhook or DM) before timers finish.

`CONTEXT.md` is the shorter guide for other agents (Gemini); keep it in sync with this file when the schema, stack or workflows change. `docs/PROJECT_OVERVIEW.md` is the original product plan with an "as built" summary. **Where any doc disagrees with this file or the code, the code wins.**

## Commands

Package manager is **pnpm** (`packageManager: pnpm@12.5.1`). Do not use npm/yarn.

- `pnpm dev` — dev server (Turbopack) on http://localhost:3000
- `pnpm build` / `pnpm start`. **Stop `pnpm dev` before building**: both use `.next/`, and a build during dev leaves the dev server serving a stale `globals.css` (UI suddenly looks unstyled; fix = stop dev, delete `.next`, restart).
- `pnpm screenshots` — with `pnpm dev` running: headless Chrome captures every UI state at 1280px and 375px into `screenshots/` (gitignored), and fails if a page scrolls sideways or throws. Server calls are stubbed in-page (no DB writes). Dashboard / My villages / home welcome-back / design-system states come from dev-only fixture pages under `app/dev/` (`/dev/dashboard`, `/dev/villages`, `/dev/styleguide`; 404 in production). Set `CHROME_PATH` if Chrome isn't found. Add a state to `scripts/screenshots.mjs` when you add UI.
- `pnpm lint` — ESLint 9 flat config (`eslint.config.mjs`)
- `pnpm test` / `pnpm test:watch` — Vitest (`vitest.config.mts`, `@/` alias set up). Unit tests sit next to the code as `*.test.ts` (pure modules). Integration tests in `tests/` run route handlers and the alert sweep against in-memory Postgres (PGlite, `tests/test-db.ts`) built from the committed migrations, with `@/lib/db`, `@/lib/auth` and Discord `fetch` mocked.
- Schema changes: edit `lib/db/schema.ts` → `pnpm db:generate --name <change>` → review the SQL in `drizzle/` → `pnpm db:migrate`. Commit the `drizzle/` folder. Don't use `drizzle-kit push` any more (it bypasses the history). Generated SQL often needs hand edits: `USING` casts for type changes, and data cleanup before new constraints (see `drizzle/0004_schema_cleanup.sql`). `pnpm test` applies every migration to an empty PGlite, so run it after editing one, then check `pnpm db:generate` reports no changes. Renames make drizzle-kit ask questions, which needs a real terminal (run it yourself, or hand-write a `--custom` migration and rebuild its snapshot).
- **Two databases:** Neon project `clash-sync` has a `development` branch (what `.env.local` points at) and a `production` branch (Vercel's `DATABASE_URL`). `pnpm db:migrate` only migrates whichever `DATABASE_URL` it sees, so a schema change must also be migrated on **production before the deploy** goes live, e.g. `DATABASE_URL='<production pooled URL>' pnpm db:migrate` (an env var set this way overrides `.env.local`). Skipping it takes prod down with `column … does not exist`.
- `pnpm db:baseline` — one-off for a database created with `push`: records `0000_baseline` as applied so `db:migrate` doesn't re-create existing tables. Idempotent.

## Stack (as built)

- **Next.js 16.4** App Router, React 19.3, TypeScript. `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md). Route handler `params` is a **Promise** (`await params`).
- **Tailwind CSS v4**, loaded through the `@tailwindcss/turbopack` loader configured in `next.config.ts`. **shadcn/ui is not installed**, despite what the docs say. The UI uses hand-written Tailwind plus `lucide-react` icons, with a dark, game-style look.
- **Design system** (Clash-inspired, no Supercell fonts/logos/art): tokens and component classes live in `app/globals.css` (night-sky palette, `panel-wood` / `panel-stone` / `well`, bevelled `btn-*`, `badge-*`, `icon-chip-*`, `pip`, `heading-outline`, `field`, `.timer`). React wrappers are in `app/_components/ui/` (`Button`/`buttonClass()` for links, `Card`/`CardHeader`/`Heading`/`Well`, `Badge`/`IconChip`/`Pip`, `CategoryBadge`, `StatusTile`). Fonts via `next/font/google` in `app/layout.tsx`: **Lilita One** (display, `font-display`) and **Nunito** (body, has tabular figures). Use these instead of ad-hoc colour classes; wood panels are for the main section of a page, stone for everything else. Countdowns use `.timer` (tabular numbers) so digits don't jitter. The page background is two `body` pseudo-elements in `globals.css`: a fixed dusk sky with a moon, a few stars (`public/sky/stars.svg`) and a warm glow at the bottom of the screen and a village skyline in front of a sunset band at the end of every page (`public/sky/skyline.svg`, kept visible by body's bottom padding). Keep page sections transparent so they show through.
- **Neon serverless Postgres + Drizzle ORM** (`drizzle-orm/neon-http`). The `neon-http` driver does **not** support interactive transactions, so multi-step writes use `db.batch([...])` (runs atomically). Generate ids up front (`crypto.randomUUID()`) so later statements in the batch can reference them.
- Path alias `@/*` → repo root.

## Layout

```
app/
  page.tsx                      Home (server): hero or "welcome back" list (behind <Suspense>), how it works, paste panel, features, FAQ
  _home/                        Home sections: hero(+preview), how-it-works, sync-panel (wraps _components/export-form: parse → POST sync → dashboard
                                with ?synced=N), find-by-tag, features, faq, welcome-back, site-header (header + footer w/ Supercell disclaimer)
  demo/                         Public read-only demo dashboard (LiveDashboard with demo prop, data from lib/demo-village.ts)
  api/village/sync/route.ts     POST {rawJson, playerTag?} → parse, upsert village by tag, DELETE its upgrades, insert new (one db.batch)
  api/village/claim/route.ts    POST {tag, token} → API-token takeover: moves the village to the logged-in account (login required)
  api/village/notifications/route.ts  PUT webhook · PATCH {dm} DM alerts · POST test · DELETE webhook (owner only)
  api/auth/[...all]/route.ts    Better Auth handler (Discord OAuth, sessions)
  api/account/after-login/route.ts  Post-login step: the bot adds the user to the ClashSync Discord server (for DMs)
  villages/                     "My villages" list for the logged-in account (page.tsx loads data; village-list-views.tsx states; village-rows.tsx
                                client rows: name, TH chip, idle/stale badges, needs-attention first)
  _components/account-menu.tsx  Login button / avatar + log out (client, uses lib/auth-client)
  _components/subpage-header.tsx  Header for inner pages (back to home, actions, account menu)
  _components/ui/               Shared design-system components (see Stack → Design system)
  dev/                          Dev-only review pages with fixture data (style guide, dashboard + villages states); 404 in production
  icon.svg, favicon.ico, apple-icon.png, opengraph-image.png, manifest.ts   App icons, share image, web manifest (public/icon-192/512.png)
  api/cron/notify/route.ts      QStash-signed sweep → Discord alerts (lib/notify.ts, lib/discord.ts)
  api/village/boosts/route.ts   POST {tag, kind} apply potion · DELETE {tag} undo latest. Writes via db.batch (atomic)
  v/[tag]/                      Live dashboard (server page streams DB data behind <Suspense>; client ticks timers). Owners get "Update timers"
                                (in-place paste, rejects other villages' exports), a "Next moves" card (next-moves.tsx: one ranked list of max 3 to-dos: done upgrades, idle builders, overnight gaps in the evening, old export, link/alerts setup), "Alerts & account" at the bottom (account-section.tsx: folds to one line once linked with alerts on), the "Tonight" card (tonight-card.tsx: what goes idle overnight; below the upgrade lists, moved above them in the 3h before the viewer's bedtime),
                                a live countdown in the tab title (use-tab-countdown.ts) and a sticky mobile Update button; profile line = cached Supercell API
lib/
  parser.ts        parseVillageExport(rawJson) → ParseResult; formatDuration(). Pure, runs client AND server side
  clash-data.ts    CLASH_ENTITIES: numeric data ID → {name, category}; resolveEntity() fallback heuristics by section
  types.ts         Raw export shapes (RawExportVillage / RawVillageItem) + ActiveUpgrade / ParseResult
  clash-api.ts     fetchPlayerProfile / verifyPlayerToken. Always via RoyaleAPI proxy (cocproxy.royaleapi.dev), so
                   CLASH_API_KEY whitelists the proxy IP and works locally + on Vercel. CLASH_API_MOCK=1 fakes both in dev (never in prod)
  db/schema.ts     Drizzle tables: auth_* (Better Auth), villages, upgrades, boosts. Header comment = column conventions
  db/index.ts      db client; forces IPv4-first DNS; falls back to loading .env.local itself
  sample-data.ts   SAMPLE_VILLAGE_JSON for demos
  tags.ts          normalizeTag() (uppercase, O→0, validates charset) / tagToSlug() — use for every tag input
  auth.ts          Better Auth server config (Discord, auth_* tables, rolling 90-day sessions, cookie cache) + getSessionUser()
  auth-client.ts   Browser auth client + signInWithDiscord(next)
  ownership.ts     getVillageAccess(): who may edit a village (owner account, or anyone if unclaimed)
  app-url.ts       appUrl(): public base URL (links in messages, auth baseURL)
  village.ts       getVillage(tag) — server data access for the dashboard
  village-status.ts formatAge() ("3h 12m ago") + villageStatus(): idle builders / stale export / needs attention for list rows. Pure
  timeline.ts      Pure math for the "Tonight" card: the viewer's night window (default 23:00–07:00, adjustable), before-bed / overnight / all-night buckets with idle time, 24h strip positions, isEvening() for the card's placement
  bedtime.ts       planBedtime(): free fixes for overnight idle slots (stay up ≤1h, Builder's Apprentice / Lab Assistant) and helper tips. Pure
  boosts.ts        Potion specs + pure timing math (boostedFinishTime, nextBoostWindow); shared by parser, API and UI
  upgrade-label.ts upgradeLabel(): display name + "(Gear-Up)" / "(Goblin/Extra)". The DB stores the plain name
  secrets.ts       sealWebhookUrl / openWebhookUrl: encryption at rest keyed from BETTER_AUTH_SECRET (server only)
scripts/           screenshots.mjs, setup-qstash-schedule.ts, db-baseline.ts, seal-webhooks.ts (one-off: encrypt old plain webhooks)
```

## Domain rules (important)

- **Export format:** top-level `tag`, `timestamp` (Unix seconds) and arrays `buildings`, `heroes`, `units`, `spells`, `pets`, `traps`, plus builder-base twins with a `2` suffix (`buildings2`, `heroes2`, `units2`, `traps2`). An item is an active upgrade when `timer > 0`. `timer` is the number of seconds left **at export time**. `data` is the entity ID, `lvl` is the current level (target = `lvl + 1`), `gear_up` marks a gear-up, and `extra` marks the goblin builder or an extra slot (not helper work). `helpers[]`: `data` 93000000 = Builder's Apprentice, 93000001 = Lab Assistant (the other two don't speed up timers), `lvl`, `helper_cooldown` = seconds until it can be assigned again (all helpers share one ~23h cooldown). Stored as `villages.apprentice_*` / `lab_assistant_*` (level + ready-at epoch).
- **Time math:** `finish = exportTimestamp + timer`, all in **UTC Unix seconds** (not ms). If `timestamp` is missing or bogus, the parser falls back to "now". Store epochs; format only for display.
- **Categories:** `BUILDER | LABORATORY | PET_HOUSE | BUILDER_BASE | OTHER`. Heroes count as `BUILDER` (home) and `BUILDER_BASE` (BB). `units` and `spells` count as `LABORATORY`, and `pets` as `PET_HOUSE`. Unknown IDs go through `resolveEntity` heuristics, so add new IDs to `CLASH_ENTITIES` when they show up.
- **`originalFinishTime` vs `currentFinishTime`:** the two are equal at sync. Only `currentFinishTime` should change (for example, from a potion). `originalFinishTime` keeps the time from the export.
- **Sync semantics:** `upgrades` holds only the village's **current** timers, with no history and no status column. A sync deletes the village's upgrade rows and inserts the new set in the same `db.batch`, after reading `notified_at` from the old rows so alerts aren't repeated (`carryOverNotified`). Finished upgrades stay until the next sync (the dashboard shows "Done"). Upgrade ids change on every sync, so never keep them across syncs (`boosts.changes` is only used before the next sync). Two first-time syncs of one tag racing → the loser gets a 409.
- **Schema conventions** (header of `lib/db/schema.ts`): game times are `bigint` Unix **seconds**, app events are `timestamptz` (JS `Date`). Our ids are `uuid`, generated in code so a batch can reference them; auth_* ids stay `text` (Better Auth's). Fixed value sets (`category`, `village_type`, `boosts.kind`, `boosts.status`) are `text` with a TS enum and a CHECK constraint built from the constants in `lib/types.ts` / `lib/boosts.ts`, not pg enums. Adding a value means changing the constant and generating a migration. `updated_at` is set automatically (`$onUpdate`), so don't set it by hand. `entity_name` is the plain name; use `upgradeLabel()` for display (dashboard, alerts).
- **Secrets at rest:** `villages.discord_webhook_url` is encrypted (`lib/secrets.ts`), and Discord OAuth tokens in `auth_account` are encrypted by Better Auth (`encryptOAuthTokens`). Read tokens with `auth.api.getAccessToken`, never straight from the table. Changing `BETTER_AUTH_SECRET` makes saved webhooks unreadable: the sweep skips them, and owners have to save them again.
- **Identity:** villages are keyed by **player tag** (`player_tag` NOT NULL UNIQUE, stored as `#XXXX`; URLs use the bare slug). Always pass tags through `normalizeTag`. A sync without a valid tag is rejected.
- **Player name:** the export has no name, so `villages.player_name` / `town_hall_level` come from the Supercell API: looked up during sync (2.5 s timeout, best effort, never overwritten with null) and refreshed by the dashboard's `PlayerProfile` via `after()` when they change. Show `playerName ?? playerTag` (dashboard heading, My villages, tab title).
- **Accounts vs villages:** people log in with Discord (Better Auth, tables `auth_user/auth_session/auth_account/auth_verification`, mapped via `modelName` in `lib/auth.ts`). `villages` has one row per Clash village; `villages.owner_id` links it to an `auth_user`. Upgrades and boosts point at it via `village_id`. Discord user id = `auth_account.account_id` where `provider_id = 'discord'` (unique per provider).
- **Ownership (`getVillageAccess`):** claimed village → only the owner account may sync/potion/alerts. Unclaimed → anyone; a **logged-in sync claims it** (no token). The **API token always wins**: `/api/village/claim` moves the village to the caller and clears the previous owner's alerts. Use `accessDeniedMessage()` for 403s.
- **Dashboard timing:** the server never computes "now". `useNow()` returns `null` during SSR/hydration so markup matches, then ticks every second on the client. Builder totals come from the Builder's Hut entries (`villages.builder_count`, summed over every hut entry because an upgrading hut gets its own entry with no `cnt`). B.O.B. isn't identifiable in the export, so the UI uses `max(builder_count, busy)`, and without a count falls back to "N busy / next free in…". Goblin (`extra`) upgrades don't count as busy; the tile adds "+ Goblin" instead.

## Roadmap / not built yet

Bedtime plan, Phase 1 done: the Tonight card shows fixes under each overnight row and the evening "Next moves" item names the best one (`lib/bedtime.ts`). A helper at level N works for 1h at (N+1)× speed, so it takes N hours off and is only suggested when ≥ N+1h are left (no waste) and it pulls the finish before bedtime; each helper goes to one upgrade, preferring ones staying up can't fix. Unused helpers get a "use it on <longest upgrade>" tip. Next: Phase 2 potions (avoid wasting a Builder/Research Potion), Phase 3 a "Bedtime check" Discord message and an "I used my helper" button. Gem costs aren't shown: no reliable current price curve.

Done: Phase 1 (parser + upgrades UI), Phase 2 (Neon/Drizzle persistence, sync API, Supercell player lookup), Phase 4 (`/v/[tag]` live dashboard, stale-export warning, idle builder/lab/pet status, API-token ownership). Phase 3 done (done after Phase 6): Vitest for the pure modules, atomic `db.batch` sync, a committed `drizzle/` migration history starting at `0000_baseline`, and `app/page.tsx` split into `app/_home/`.

Phase 5 done: Builder Potion (10× for 1h, ≤9h saved) and Research Potion (24× for 1h, ≤23h saved). Only `currentFinishTime` changes. Potions stack: the next one starts at `villages.*_boost_ends_at`. Each potion is logged in `boosts` with the finish times it changed. Only the latest `APPLIED` one can be undone, and only if those times are unchanged. A re-sync marks earlier boosts `SUPERSEDED`. The export's `boosts.builder_boost` is applied at parse time. The export has no research-boost field, so a re-sync keeps an in-app Research Potion that is still running at export time (`villages.lab_boost_ends_at`) and re-applies its remainder to lab timers (`finishWithRunningBoost`).

Phase 6 done: Discord alerts.
- Verified owners save a Discord **webhook URL** on the dashboard (`/api/village/notifications`: PUT save, which sends a confirmation first, POST test, DELETE off). The URL is validated as a Discord webhook (SSRF guard), stored encrypted, and never sent to the client (`webhookAlerts` only).
- **Early alerts:** each village picks a lead time (`villages.alert_lead_minutes`, default 5; 0 = when done). The sweep claims upgrades finishing by `now + lead + 2 min`, so alerts land `lead`–`lead+2` min before the finish (`lib/alerts.ts`, `SWEEP_INTERVAL_SECONDS` must match the cron). Messages use Discord `<t:…:R>` timestamps (live countdown, reader timezone). A re-sync carries `notified_at` over to matching new rows (`carryOverNotified`) so players aren't alerted twice.
- **One QStash schedule** (`pnpm qstash:schedule <public-url>`, id `clashsync-notify`, every 2 min) POSTs to `/api/cron/notify`. That endpoint verifies `upstash-signature`; unsigned requests are allowed only in dev. Per-upgrade QStash messages were deliberately not used.
- The sweep (`lib/notify.ts`) claims due rows with one `UPDATE … WHERE notified_at IS NULL RETURNING` (partial index `upgrades_pending_alert_idx`), which prevents double sends, then sends one message per village. Upgrades finished more than 30 min ago are skipped. 429/5xx failures release the claim for retry. Undoing a potion re-arms the alert (clears `notified_at`).
- Notified rows stay until the next sync (the dashboard shows "Done").
- **Idle nudge** (`runIdleReminderSweep`, same cron run, after the alert sweep; its failure never fails the run): when a main-slot upgrade (not Goblin/extra) finished `IDLE_AFTER_SECONDS` (1h) ago, within a 30-min window so an old export never triggers it, and there has been no re-sync since, it sends one "anything sitting idle?" message to the same destinations. Claimed with `UPDATE villages SET idle_reminded_at … RETURNING`; a sync clears `idle_reminded_at`, so at most one nudge per sync. Owners toggle it (`villages.idle_reminders`, default on) via `PATCH /api/village/notifications {idleReminders}`. Uses only our data, no Supercell API calls.

Phase 7 done: Discord login (self-hosted Better Auth), account-owned villages (claim on sync, API-token takeover), "My villages", and bot DM alerts. Login requests `guilds.join`; after login the bot adds the user to the ClashSync server (`DISCORD_GUILD_ID`) because bots can only DM people they share a server with. `villages.dm_alerts` turns DMs on (PATCH sends a confirmation DM first). The sweep sends to the webhook and/or DM; it only retries when nothing got through. DM UI is hidden unless `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` are set.

Cleanup done: legacy `cs_owner` cookie removed, `users` renamed to `villages` (`drizzle/0003_villages.sql`, hand-written: drizzle-kit can't answer rename prompts without a TTY, so the snapshot was rebuilt with `drizzle-kit/api`), unused columns dropped, integration tests added.

Schema cleanup done (`drizzle/0004_schema_cleanup.sql`): upgrades replaced on sync (status and `remaining_seconds_at_export` dropped, old `CANCELLED` rows deleted), `player_tag` NOT NULL, uuid ids, timestamptz, CHECK constraints, unique `auth_account(provider_id, account_id)`, encrypted webhook URLs and OAuth tokens, plain `entity_name`.

## Conventions

- Env: copy `.env.example` → `.env.local`. All `.env*` except `.env.example` are gitignored. Use the **pooled** Neon connection string.
- API responses use the shape `{ success: boolean, error?: string, ... }`, with errors caught and returned as JSON (400 for bad input, 404 when not found, 500 for DB errors).
- User-facing copy should be player-friendly, not backend jargon. A recent commit replaced technical wording on purpose.
- Keep `lib/parser.ts` free of server-only imports, because the client page imports it directly.
- Commits use conventional style (`feat(scope):`, `fix:`, `chore:`, `style(ux):`, `docs:`).

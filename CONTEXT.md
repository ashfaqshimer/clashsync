# ClashSync Context & Developer Guide

Short guide for AI agents (Gemini and others). `CLAUDE.md` is the full guide; where the two disagree, `CLAUDE.md` and then the code win. Keep this file in sync when the schema, stack or workflows change.

## 1. Project Summary
**ClashSync** is a web app for Clash of Clans players. They paste the game's **Export Village** JSON and see every running upgrade (builders, laboratory, pet house, builder base) with exact finish times. They can apply Builder/Research Potions and get Discord alerts (channel webhook or bot DM) shortly before timers finish.

## 2. Tech Stack (as built)
- **Next.js 16.4** App Router, React 19.3, TypeScript. Read `node_modules/next/dist/docs/` before using Next APIs (see `AGENTS.md`). Route handler `params` is a Promise.
- **Tailwind CSS v4** with a hand-written design system in `app/globals.css` and `app/_components/ui/`. **No shadcn/ui.**
- **Neon Postgres + Drizzle ORM** (`drizzle-orm/neon-http`). No interactive transactions, so multi-step writes use `db.batch([...])` (atomic).
- **Better Auth** (self-hosted) for Discord login.
- **Upstash QStash**: one schedule every 2 min POSTs to `/api/cron/notify` (signature verified). There are no per-upgrade messages.
- **pnpm** only. Tests: Vitest (unit tests next to code; integration tests in `tests/` on in-memory PGlite built from the migrations).

## 3. Core Workflows

### A. Sync (paste export)
1. The client parses the JSON with `lib/parser.ts` (pure, also runs on the server): `finish = export timestamp + timer`, in UTC **Unix seconds**.
2. `POST /api/village/sync` upserts the village by **player tag** (`normalizeTag`). It then **deletes the village's upgrade rows and inserts the new set** in one `db.batch`. `upgrades` only ever holds the current timers; there is no history and no status column.
3. Before deleting, it reads which old upgrades were already alerted and carries `notified_at` over to matching new rows (`carryOverNotified`), so nobody is alerted twice.
4. A logged-in sync of an unclaimed village claims it for that account.
5. The export has no player name, so the sync also looks up the name and Town Hall level in the Supercell API (2.5 s timeout, best effort; a failure keeps the stored values). The dashboard refreshes them when they change. The UI shows `player_name ?? player_tag`.

### B. Potions
- Builder Potion: builders 10× for 1h (up to 9h saved). Research Potion: lab 24× for 1h (up to 23h saved). Only `current_finish_time` changes; `original_finish_time` keeps the export's time.
- Potions stack after `villages.builder_boost_ends_at` / `lab_boost_ends_at`. Each one is logged in `boosts`, and only the latest `APPLIED` one can be undone (if its timers are unchanged). A re-sync marks boosts `SUPERSEDED`.

### C. Discord Alerts
- Each village picks a lead time (`alert_lead_minutes`, default 5; 0 = when done).
- The sweep (`lib/notify.ts`) claims due rows with a single `UPDATE … WHERE notified_at IS NULL RETURNING`, then sends one message per village to the webhook and/or a DM to the owner. On 429/5xx it releases the claim so the next run retries.
- Idle nudge (`runIdleReminderSweep`, same cron run): one "anything sitting idle?" message when an upgrade finished 1h ago (30-min window) with no re-sync since. `villages.idle_reminded_at` makes it once per sync (sync clears it); `villages.idle_reminders` (default on) is the owner toggle.

## 4. Database Schema (`lib/db/schema.ts`)
Conventions: game times are `bigint` Unix seconds, app events are `timestamptz`. Our ids are `uuid` (generated in code); auth ids are `text`. Fixed value sets are `text` + a CHECK constraint (no pg enums). `updated_at` updates automatically.

- **`auth_user` / `auth_session` / `auth_account` / `auth_verification`**: Better Auth tables (people, not villages). `auth_account` is unique on `(provider_id, account_id)`. The Discord user id is `account_id` where `provider_id = 'discord'`. OAuth tokens are encrypted by Better Auth; read them via `auth.api.getAccessToken`.
- **`villages`**: one row per Clash village.
  - `id` uuid, `player_tag` text NOT NULL UNIQUE (`#XXXX`), `owner_id` → `auth_user` (null = unclaimed), `verified_at`
  - `player_name`, `town_hall_level` (Supercell API, nullable)
  - `last_export_timestamp`, `builder_count`, `builder_boost_ends_at`, `lab_boost_ends_at` (Unix seconds)
  - `apprentice_level` / `apprentice_ready_at`, `lab_assistant_level` / `lab_assistant_ready_at`: Helper Hut from the export's `helpers[]` (ready-at = export time + `helper_cooldown`); used by the bedtime plan (`lib/bedtime.ts`)
  - `bedtime_check` (default off), `night_start_hour` / `night_end_hour` (default 23 / 7), `time_zone` (IANA), `bedtime_checked_at`: the evening "Bedtime check" Discord message (`runBedtimeCheckSweep` in `lib/notify.ts`, once per night)
  - `discord_webhook_url` (**encrypted**, `lib/secrets.ts`; never sent to the client), `dm_alerts`, `alert_lead_minutes` (0–1440), `idle_reminders`, `idle_reminded_at`
- **`upgrades`**: the village's current timers, replaced on every sync.
  - `id` uuid, `village_id` → `villages` (cascade), `data_id`, `entity_name` (plain name; the UI adds "(Gear-Up)" / "(Goblin/Extra)" via `upgradeLabel()`)
  - `category` (`BUILDER | LABORATORY | PET_HOUSE | BUILDER_BASE | OTHER`), `village_type` (`HOME | BUILDER_BASE`)
  - `current_level`, `target_level`, `original_finish_time`, `current_finish_time` (Unix seconds), `is_gear_up`, `is_extra_slot`, `notified_at`
- **`boosts`**: potion log for undo: `kind` (`BUILDER_POTION | RESEARCH_POTION`), `window_start/end`, `previous_boost_ends_at`, `changes` jsonb (`{upgradeId, from, to}[]`), `status` (`APPLIED | UNDONE | SUPERSEDED`).

Schema changes: edit `schema.ts` → `pnpm db:generate --name <change>` → review/hand-edit the SQL in `drizzle/` → `pnpm test` → `pnpm db:migrate`. Never use `drizzle-kit push`. `.env.local` is the Neon **development** branch; also migrate the **production** branch (`DATABASE_URL=<prod URL> pnpm db:migrate`) before deploying, or prod fails with `column … does not exist`.

## 5. Environment Variables
See `.env.example`. Main ones: `DATABASE_URL` (pooled Neon), `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_SECRET` (signs sessions **and** encrypts webhooks/OAuth tokens; changing it means saved webhooks have to be added again), `DISCORD_CLIENT_ID/SECRET`, `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` (DM alerts), `QSTASH_*`, `CLASH_API_KEY`.

## 6. Project Guidelines
- Store epochs and format only for display. The server never computes "now" for the dashboard (`useNow()` on the client).
- Keep `lib/parser.ts` free of server-only imports.
- API responses: `{ success: boolean, error?: string, ... }`. Copy is player-friendly, not technical.
- Validate QStash signatures. Treat Discord webhook URLs as secrets.

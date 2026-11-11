# ClashSync Context & Developer Guide

## 1. Project Summary
**ClashSync** is a web application designed for Clash of Clans players to live-sync and track active builder, laboratory, and pet house queues by ingesting the game's official "Export Village" JSON. It tracks countdown timers, supports instant acceleration calculations (e.g. Builder Potions), and sends automated completion alerts via Discord.

---

## 2. Tech Stack
- **Framework:** Next.js 16+ (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4, shadcn/ui (dark mode / gaming aesthetic).
- **Database:** PostgreSQL (with Drizzle ORM or Prisma) storing user profiles, active queues, and notification preferences.
- **Job Scheduling:** Upstash QStash (serverless cron & delayed webhook execution to trigger timer completions).
- **Notification Provider:** Discord (Discord Bot API DM or Webhook integration; replaced Telegram).

---

## 3. Core Architecture & Workflows

### A. Village JSON Ingestion
1. The user exports village data from Clash of Clans settings and uploads/pastes the raw JSON into the app.
2. The parser calculates the exact completion timestamps (`finish_time = json_export_timestamp + remaining_seconds`) for:
   - Builders (up to 6 builders + goblin builder if active)
   - Laboratory (troops, spells, siege machines)
   - Pet House (hero pets)
3. Active records are updated in the database, replacing expired or obsolete queues.
4. For each active upgrade, a delayed webhook task is scheduled via Upstash QStash for `current_finish_time`.

### B. Builder Potion Handling ("Pop Potion")
1. Deducts 9 hours (32,400 seconds) from all active builder timers.
2. Recalculates `current_finish_time`.
3. Cancels existing QStash scheduled messages and schedules new ones with the updated timestamps.

### C. Discord Notifications
1. When a timer expires, QStash triggers `/api/webhooks/notify` with message signature verification.
2. The server verifies the signature and sends a message to Discord (either direct message via Bot API or to a dedicated channel webhook).
3. Sample Alert: *"Chief, your Eagle Artillery Level 7 has finished upgrading!"*

---

## 4. Key Entities & Database Schema

### `users`
- `id`: UUID (Primary Key)
- `discord_user_id`: String (nullable, for Bot DMs)
- `discord_webhook_url`: String (nullable, for channel notifications)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `upgrades`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> `users.id`)
- `entity_name`: String (e.g. "Eagle Artillery Lvl 7", "Barbarian King Lvl 95")
- `type`: Enum (`BUILDER`, `LABORATORY`, `PET_HOUSE`)
- `original_finish_time`: Integer / BigInt (Unix epoch timestamp)
- `current_finish_time`: Integer / BigInt (Unix epoch timestamp)
- `qstash_message_id`: String (nullable, tracking scheduled QStash job)
- `status`: Enum (`ACTIVE`, `COMPLETED`, `CANCELLED`)

---

## 5. Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io/v2/publish/
QSTASH_TOKEN=ey...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...

# Discord
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Project Guidelines
- Keep Next.js App Router server and client components cleanly separated.
- Follow Tailwind v4 conventions for styling.
- All time calculations must be timezone-agnostic using UTC / Unix epoch timestamps.
- Validate incoming QStash webhook signatures for security.


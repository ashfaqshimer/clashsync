# Project Overview: ClashSync

**Objective:** A web application that parses the official Clash of Clans "Export Village" JSON to live-sync active builder, laboratory, and pet house queues. The app will calculate exact finish times, allow users to apply Builder Potions to adjust timers, and send automated completion alerts via Discord (Bot / Webhooks).

---

## 1. Tech Stack & Infrastructure

- **Frontend:** Next.js (App Router), React, TypeScript.
- **UI/Styling:** Tailwind CSS, shadcn/ui (dark theme optimized for gaming aesthetics).
- **Database:** PostgreSQL (via Prisma or Drizzle) or Firebase to store user profiles, linked Discord user/webhook info, and active timers.
- **Background Jobs/Scheduling:** Upstash QStash (ideal for serverless Next.js architectures) to handle precise webhook scheduling without requiring a continuously running backend server.
- **Notifications:** Discord API (Discord Bot DMs or Channel Webhooks).

---

## 2. Core Features (MVP)

- **JSON Ingestion Engine:** A drag-and-drop or paste zone for the Supercell JSON file. The client-side/server logic will parse the file to find items currently under construction.
- **Dashboard / Tracker UI:** A visual representation of up to 6 builders, the laboratory, and the pet house. Shows live countdowns based on calculated timestamps.
- **"Pop Potion" Global Action:** A single button that deducts 9 hours (32,400 seconds) from all active builder timers in the database and recalculates the finish time instantly.
- **Discord Integration:** A pairing system (via Discord Bot slash commands/tokens, Discord OAuth2, or custom Discord webhook URLs) to link user accounts and deliver push notifications when a timer hits zero.

---

## 3. Data Architecture & Flow

### A. The Database Schema (Simplified)

- **Users Table:** `id`, `discord_user_id`, `discord_webhook_url`, `created_at`
- **Upgrades Table:**
  - `id` (UUID)
  - `user_id` (Foreign Key)
  - `entity_name` (e.g., "Eagle Artillery Lvl 7", "Barbarian King Lvl 95")
  - `type` (Builder, Laboratory, Pet House)
  - `original_finish_time` (Unix timestamp)
  - `current_finish_time` (Unix timestamp, updated when potions are used)
  - `qstash_message_id` (To cancel/reschedule the webhook if a potion is used)

### B. The Sync Workflow

1. User pastes the JSON payload.
2. Next.js API parses the JSON and calculates the exact `finish_time` timestamps for all active upgrades based on the exact second the JSON was generated.
3. The server clears the user's old upgrades in the DB and writes the new ones.
4. For each new upgrade, Next.js sends a payload to Upstash QStash scheduled for `current_finish_time`.

### C. The Potion Workflow

1. User clicks **"Use Builder Potion"** on the dashboard.
2. The database updates all active _Builder_ upgrades for that user, subtracting 9 hours from `current_finish_time`.
3. The Next.js API cancels the existing QStash scheduled messages and creates new ones with the accelerated timestamps.

### D. The Notification Workflow

1. At the exact `current_finish_time`, QStash hits your Next.js API endpoint (e.g., `/api/webhooks/notify`).
2. The endpoint verifies the QStash signature.
3. The endpoint triggers the Discord API / Webhook to send: _"Chief, your Eagle Artillery Level 7 has finished upgrading!"_ to the user.

---

## 4. Next Steps for Implementation

1. **Scaffold the Next.js App:** Initialize the repository, set up Tailwind and shadcn/ui.
2. **Reverse-Engineer the JSON:** Export village data from the game. Inspect the JSON structure to map exactly where Supercell stores the active countdowns (look for arrays related to `buildings`, `hero`, or `laboratory` that contain a `timer` or `construction` key).
3. **Build the Parser:** Write a TypeScript utility function that takes the raw JSON string and returns a clean array of active upgrade objects.
4. **Setup Discord Bot/Webhooks:** Create an application in the Discord Developer Portal, configure bot permissions (or webhook delivery), and build the Next.js API route that handles user linking and notification dispatch.

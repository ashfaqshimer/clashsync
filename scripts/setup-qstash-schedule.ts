/**
 * Creates (or updates) the QStash schedule that drives Discord alerts.
 *
 *   pnpm qstash:schedule https://your-app.vercel.app
 *
 * Re-running is safe: the fixed scheduleId makes this an upsert.
 * QStash must reach the URL from the internet, so localhost won't work.
 */
import { config } from "dotenv";
import { Client } from "@upstash/qstash";

config({ path: ".env.local", quiet: true });

const SCHEDULE_ID = "clashsync-notify";
// Every 2 minutes = 720 calls/day, which fits QStash's free daily message quota
const CRON = "*/2 * * * *";

async function main() {
  const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  if (!/^https:\/\//.test(base) || /localhost|127\.0\.0\.1/.test(base)) {
    console.error(
      "Pass your public HTTPS app URL, e.g. pnpm qstash:schedule https://your-app.vercel.app"
    );
    process.exit(1);
  }
  if (!process.env.QSTASH_TOKEN) {
    console.error("QSTASH_TOKEN is not set in .env.local");
    process.exit(1);
  }

  const client = new Client(); // reads QSTASH_URL + QSTASH_TOKEN from env
  const destination = `${base}/api/cron/notify`;
  await client.schedules.create({
    scheduleId: SCHEDULE_ID,
    destination,
    cron: CRON,
    method: "POST",
    retries: 2,
  });

  const schedule = await client.schedules.get(SCHEDULE_ID);
  console.log(`Schedule "${SCHEDULE_ID}" → ${schedule.destination} (${schedule.cron})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

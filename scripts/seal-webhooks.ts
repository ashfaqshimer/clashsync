/**
 * One-off: encrypts Discord webhook URLs saved before they were encrypted at
 * rest (drizzle/0004_schema_cleanup). Idempotent: rows that already decrypt are skipped.
 *
 *   pnpm tsx scripts/seal-webhooks.ts
 */
import { config } from "dotenv";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "../lib/db";
import { villages } from "../lib/db/schema";
import { openWebhookUrl, sealWebhookUrl } from "../lib/secrets";

config({ path: ".env.local", quiet: true });

async function main() {
  const rows = await db
    .select({ id: villages.id, url: villages.discordWebhookUrl })
    .from(villages)
    .where(isNotNull(villages.discordWebhookUrl));

  let sealed = 0;
  for (const row of rows) {
    if (!row.url || (await openWebhookUrl(row.url))) continue;
    await db
      .update(villages)
      .set({ discordWebhookUrl: await sealWebhookUrl(row.url) })
      .where(eq(villages.id, row.id));
    sealed++;
  }
  console.log(`${rows.length} webhook(s) found, ${sealed} encrypted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

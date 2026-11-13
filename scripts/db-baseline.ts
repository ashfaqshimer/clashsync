/**
 * One-off: marks drizzle/0000_baseline.sql as already applied.
 *
 *   pnpm db:baseline
 *
 * The database was created with `drizzle-kit push`, so its tables already
 * match the baseline but it has no migration history. Without this,
 * `drizzle-kit migrate` would try to re-create the tables and fail. It records
 * the baseline the same way drizzle's migrator does (sha256 of the SQL file,
 * journal timestamp) and runs no DDL against the app tables.
 *
 * Safe to re-run: it does nothing once the baseline is recorded.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

const BASELINE_TAG = "0000_baseline";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string; when: number }[];
  };
  const entry = journal.entries.find((e) => e.tag === BASELINE_TAG);
  if (!entry) throw new Error(`${BASELINE_TAG} is missing from drizzle/meta/_journal.json`);

  const hash = createHash("sha256")
    .update(readFileSync(`drizzle/${BASELINE_TAG}.sql`, "utf8"))
    .digest("hex");

  // Only baseline a database that already has the app's tables
  const [{ count }] = await sql`
    select count(*)::int as count from information_schema.tables
    where table_schema = 'public' and table_name in ('users', 'upgrades', 'boosts')`;
  if (count !== 3) {
    console.error("This database doesn't have the app tables yet. Run `pnpm db:migrate` instead.");
    process.exit(1);
  }

  await sql`create schema if not exists drizzle`;
  await sql`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )`;

  const existing = await sql`
    select 1 from drizzle.__drizzle_migrations where created_at >= ${entry.when} limit 1`;
  if (existing.length > 0) {
    console.log("Baseline already recorded. Nothing to do.");
    return;
  }

  await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`;
  console.log(`Recorded ${BASELINE_TAG} as applied.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

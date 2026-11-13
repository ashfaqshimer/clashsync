/**
 * In-memory Postgres (PGlite) built from the committed migrations in drizzle/,
 * so integration tests run real SQL and also prove the migrations apply
 * cleanly to an empty database.
 *
 * Usage in a test file (before importing app code):
 *   vi.mock("@/lib/db", async () => (await import("./test-db")).dbModule());
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";

const client = new PGlite();
const pglite = drizzle(client, { schema });

/**
 * Production uses neon-http's db.batch (atomic). PGlite has no batch, so run
 * the statements in order inside one transaction, which is the same contract.
 */
export const testDb = Object.assign(pglite, {
  async batch(statements: readonly PromiseLike<unknown>[]) {
    await client.exec("begin");
    try {
      const results = [];
      for (const s of statements) results.push(await s);
      await client.exec("commit");
      return results;
    } catch (err) {
      await client.exec("rollback");
      throw err;
    }
  },
});

let migrated: Promise<void> | null = null;
export function migrateTestDb() {
  migrated ??= migrate(pglite, { migrationsFolder: "drizzle" });
  return migrated;
}

/** Empties every app table between tests. */
export async function resetTestDb() {
  await migrateTestDb();
  await client.exec(
    "truncate boosts, upgrades, villages, auth_session, auth_account, auth_verification, auth_user cascade"
  );
}

export function dbModule() {
  return { db: testDb };
}

export const { villages, upgrades, boosts, authUsers, authAccounts } = schema;

/** Creates a logged-in-able account with a linked Discord account. */
export async function createAccount(id: string, discordId = `${id}-discord`) {
  await testDb.insert(authUsers).values({ id, name: id, email: `${id}@test.invalid` });
  await testDb.insert(authAccounts).values({
    id: `${id}-acct`,
    accountId: discordId,
    providerId: "discord",
    userId: id,
  });
}

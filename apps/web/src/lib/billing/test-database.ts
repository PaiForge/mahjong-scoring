import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
const namespace = `billing_test_${randomUUID().replaceAll("-", "")}`;
let client: ReturnType<typeof postgres> | undefined;
/** ローカル DB の専用スキーマに複数接続し、実際のロック競合を検証する。 */
export function billingTestDb() {
  const url = process.env.BILLING_TEST_DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error("Local BILLING_TEST_DATABASE_URL required");
  client ??= postgres(url, {
    max: 4,
    prepare: false,
    connection: { search_path: namespace },
  });
  return drizzle(client, { schema });
}
/** DDL をテスト用スキーマにのみ適用。アプリの表・migration journal は触れない。 */
export async function setupBillingTestDb() {
  billingTestDb();
  if (!client) throw new Error("Test DB not initialized");
  await client.unsafe(`CREATE SCHEMA "${namespace}"`);
  for (const name of [
    "20261001031520_create_purchases.sql",
    "20261001085049_create_benefit_grants.sql",
    "20261001092536_add_billing_checkouts.sql",
    "20261002125751_create_notifications.sql",
  ]) {
    const ddl = await readFile(
      new URL(`../../../drizzle/${name}`, import.meta.url),
      "utf8",
    );
    await client.unsafe(ddl.replaceAll('"public".', `"${namespace}".`));
  }
}
/** この実行が作ったスキーマだけを破棄する。 */
export async function closeBillingTestDb() {
  if (client) {
    await client.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    await client.end();
    client = undefined;
  }
}

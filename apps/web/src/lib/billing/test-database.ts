import { createIsolatedSchemaTestDb } from "../db/isolated-schema-test-db";

const testDb = createIsolatedSchemaTestDb({
  prefix: "billing",
  migrations: [
    "20261001031520_create_purchases.sql",
    "20261001085049_create_benefit_grants.sql",
    "20261001092536_add_billing_checkouts.sql",
    "20261002125751_create_notifications.sql",
    "20261008085348_create_account_deletions.sql",
    "20261008222040_add_apple_refresh_tokens.sql",
    "20261011050421_add_apple_iap_to_purchases.sql",
    "20261011063801_add_signed_date_to_apple_notification_events.sql",
    "20261108035603_add_locale_to_billing_checkouts.sql",
    "20261113222530_add_google_iap_to_purchases.sql",
  ],
});

/** ローカル DB の専用スキーマに複数接続し、実際のロック競合を検証する。 */
export function billingTestDb() {
  return testDb.db();
}
/** DDL をテスト用スキーマにのみ適用。アプリの表・migration journal は触れない。 */
export async function setupBillingTestDb() {
  await testDb.setup();
}
/** この実行が作ったスキーマだけを破棄する。 */
export async function closeBillingTestDb() {
  await testDb.close();
}

import { billingTestDb } from "./test-database";

/**
 * 実 DB の統合テスト用の `@/lib/db` の差し替え
 * 統合テストDBモック
 *
 * スキーマはそのまま、`db` だけをテスト用スキーマへの接続（{@link billingTestDb}）に
 * 置き換える。`BILLING_TEST_DATABASE_URL` が無ければ `db` は undefined で、
 * テスト側はその場合を skip する:
 *
 * ```ts
 * vi.mock("@/lib/db", async () => await import("@/lib/billing/test-database-mock"));
 * ```
 *
 * このモジュールはテスト専用。
 */
export * from "../db/schema";

export const db = process.env.BILLING_TEST_DATABASE_URL
  ? billingTestDb()
  : undefined;

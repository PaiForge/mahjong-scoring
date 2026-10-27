import { mockTransaction } from "./admin-action-mocks";

/**
 * 管理者の Server Action のテストで `@/lib/db` を差し替える module
 * 管理者アクションDBモック
 *
 * `db.transaction` だけを使うアクション（BAN・特典の付与と取り消し）は
 * `vi.mock("@/lib/db", () => import("@/test/admin-action-db-mock"))` の 1 行で済む。
 * `transaction` は {@link mockTransaction} そのものなので、`setupAdminActor()` で
 * 中身を実行させ、呼び出しの検証も `admin-action-mocks` から引いた同じモックで行う。
 * `profiles` は `tx.update(profiles)` に渡す表の目印（BAN が更新する）。
 *
 * トランザクションの外でも `db.select` 等を引くアクション（BAN 解除・
 * プロフィールの消去）は、テスト固有のモックが要るのでテスト側で組む。
 *
 * このモジュールはテスト専用。
 */
export const db = { transaction: mockTransaction };

export { profiles } from "./schema-mock";

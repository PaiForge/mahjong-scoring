import { mockTransaction } from "./admin-action-mocks";

/**
 * 管理者の Server Action のテストで `@/lib/db` を差し替える module
 * 管理者アクションDBモック
 *
 * `db.transaction` だけを使うアクション（BAN・特典の付与と取り消し・広告・
 * お知らせ）は `vi.mock("@/lib/db", () => import("@/test/admin-action-db-mock"))`
 * の 1 行で済む。`transaction` は {@link mockTransaction} そのものなので、
 * `setupAdminActor()` で中身を実行させ、呼び出しの検証も `admin-action-mocks`
 * から引いた同じモックで行う。表（`profiles`・`adCreatives` 等）は
 * `tx.update(profiles)` に渡す目印で、カラム名は `schema-mock` が 1 箇所で持つ。
 *
 * トランザクションの外でも `db.select` 等を引くアクション（BAN 解除・
 * プロフィールの消去・広告の更新）は、この module を spread した上に
 * テスト固有の `db` を重ねる（`update-ad-creative.test.ts`）。
 *
 * このモジュールはテスト専用。
 */
export const db = { transaction: mockTransaction };

export {
  adCreativeTranslations,
  adCreatives,
  adNetworkSettings,
  announcements,
  profiles,
} from "./schema-mock";

import { vi } from "vitest";

/**
 * 管理者の Server Action（BAN・特典の付与と取り消し）のテスト用スタブ
 * 管理者アクションモック
 *
 * どのアクションも `requireAdminActor` → `getClientIp` → `db.transaction` の
 * 順に通る。各テストが同じ `vi.fn()` 生成・`vi.mock` 登録・「管理者として
 * 通過した状態」の初期化を書いていたのでここへまとめる。
 *
 * export はモック対象の module 形にも揃えてあるため、`vi.mock` のファクトリに
 * そのまま渡せる（`@/lib/db` はテストごとに他のメンバーも要るので
 * `mockTransaction` だけを取り出して組む）:
 *
 * ```ts
 * vi.mock("@/lib/client-ip", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("../../../_lib/auth", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("@/lib/db", async () => ({
 *   db: { transaction: (await import("@/test/admin-action-mocks")).mockTransaction },
 * }));
 *
 * beforeEach(() => {
 *   vi.clearAllMocks();
 *   setupAdminActor(TX);
 * });
 * ```
 *
 * 拒否される側（管理者でない等）を見たいテストは、`setupAdminActor()` の
 * あとに該当のモックだけ上書きすること。
 *
 * このモジュールはテスト専用。
 */

/** `admin/_lib/auth` の `requireAdminActor` の差し替え先 */
export const mockRequireAdminActor = vi.fn();

/** `@/lib/client-ip` の `getClientIp` の差し替え先 */
export const mockGetClientIp = vi.fn();

/** `@/lib/db` の `db.transaction` の差し替え先 */
export const mockTransaction = vi.fn();

/** `vi.mock("<admin/_lib/auth>", ...)` 用のエイリアス */
export const requireAdminActor = mockRequireAdminActor;

/** `vi.mock("@/lib/client-ip", ...)` 用のエイリアス */
export const getClientIp = mockGetClientIp;

/** 操作した管理者の id */
export const ADMIN_ACTOR_ID = "admin-1";

/** 操作元の IP */
export const ADMIN_CLIENT_IP = "203.0.113.1";

/**
 * 管理者として通過し、トランザクションの中身をそのまま実行する状態にする
 * 管理者通過設定
 *
 * @param tx - トランザクションのコールバックに渡す偽の tx
 */
export function setupAdminActor(tx: unknown): void {
  mockRequireAdminActor.mockResolvedValue({ actorId: ADMIN_ACTOR_ID });
  mockGetClientIp.mockResolvedValue(ADMIN_CLIENT_IP);
  mockTransaction.mockImplementation(
    async (fn: (transaction: unknown) => Promise<void>) => fn(tx),
  );
}

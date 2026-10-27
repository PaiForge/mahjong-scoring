import { vi, type Mock } from "vitest";

/**
 * 管理者の Server Action（BAN・特典の付与と取り消し・広告・お知らせ）のテスト用スタブ
 * 管理者アクションモック
 *
 * どのアクションも `requireAdminActor` → `getClientIp` → `db.transaction` の
 * 順に通り、操作を記録して（利用者が対象なら `recordModerationAction`、
 * 広告・お知らせなら `recordContentAction`）画面を再検証する
 * （`revalidatePath`）。各テストが同じ `vi.fn()` 生成・`vi.mock` 登録・「管理者として
 * 通過した状態」の初期化を書いていたのでここへまとめる。
 *
 * export はモック対象の module 形にも揃えてあるため、`vi.mock` のファクトリに
 * そのまま渡せる（`@/lib/db` は `db.transaction` を {@link mockTransaction} にした
 * `admin-action-db-mock` を渡す。トランザクションの外でも `db` を引くアクションは
 * `mockTransaction` を取り出してテスト側で組む）:
 *
 * ```ts
 * vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("@/lib/client-ip", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("../../../_lib/auth", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("../../_lib/moderation", async (importOriginal) => ({
 *   ...(await importOriginal<typeof import("../../_lib/moderation")>()),
 *   recordModerationAction: (await import("@/test/admin-action-mocks"))
 *     .mockRecordModerationAction,
 * }));
 * vi.mock("@/lib/supabase/admin", async () => await import("@/test/admin-action-mocks"));
 * vi.mock("@/lib/db", () => import("@/test/admin-action-db-mock"));
 *
 * beforeEach(() => {
 *   vi.clearAllMocks();
 *   setupAdminActor(TX);
 * });
 * ```
 *
 * 拒否される側を見たいテストは、`setupAdminActor()` のあとに該当のモックだけ
 * 上書きする。管理者でない状態は {@link setupNotAdmin} で作る。
 *
 * このモジュールはテスト専用。
 */

/** `admin/_lib/auth` の `requireAdminActor` の差し替え先 */
export const mockRequireAdminActor = vi.fn();

/** `@/lib/client-ip` の `getClientIp` の差し替え先 */
export const mockGetClientIp = vi.fn();

/** `@/lib/db` の `db.transaction` の差し替え先 */
export const mockTransaction = vi.fn();

/** `next/cache` の `revalidatePath` の差し替え先 */
export const mockRevalidatePath = vi.fn();

/** `admin/users/_lib/moderation` の `recordModerationAction` の差し替え先 */
export const mockRecordModerationAction = vi.fn();

/** `admin/_lib/content-action` の `recordContentAction` の差し替え先 */
export const mockRecordContentAction = vi.fn();

/** `next/cache` の `revalidateTag`（BAN でランキングのキャッシュを捨てる） */
export const mockRevalidateTag = vi.fn();

/** `@/lib/notifications/create-notification` の `notifyQuietly` の差し替え先 */
export const mockNotify = vi.fn();

/** `@/lib/supabase/admin` の Auth の `updateUserById`（BAN・BAN 解除が Auth 側の停止を切り替える） */
export const mockUpdateUserById = vi.fn();

/**
 * `vi.mock("@/lib/supabase/admin", ...)` 用。Auth の管理 API のうち
 * BAN・BAN 解除が使う `updateUserById` だけを持つ
 */
export function createAdminClient() {
  return { auth: { admin: { updateUserById: mockUpdateUserById } } };
}

/** `vi.mock("<admin/_lib/auth>", ...)` 用のエイリアス */
export const requireAdminActor = mockRequireAdminActor;

/** `vi.mock("@/lib/client-ip", ...)` 用のエイリアス */
export const getClientIp = mockGetClientIp;

/** `vi.mock("next/cache", ...)` 用のエイリアス */
export const revalidatePath = mockRevalidatePath;

/** `next/cache` の `revalidateTag` */
export const revalidateTag = mockRevalidateTag;

/** `vi.mock("@/lib/notifications/create-notification", ...)` 用のエイリアス */
export const notifyQuietly = mockNotify;

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

/**
 * 管理者でない（`requireAdminActor` が拒否を返す）状態にする
 * 管理者拒否設定
 *
 * `setupAdminActor()` のあとに呼ぶ。実物と同じく、アクションが渡した
 * エラーキー（`unauthorized` / `errorSaveFailed` 等）をそのまま返す。拒否の形
 * （`{ error: <キー> }`）を各テストが書き写さないよう、ここで 1 つ持つ。
 */
export function setupNotAdmin(): void {
  mockRequireAdminActor.mockImplementation(async (failureError: string) => ({
    error: failureError,
  }));
}

/** `tx.update(table).set(...).where(...)` を受ける偽のトランザクション */
export interface UpdateTxMock {
  /** `setupAdminActor()` と `recordModerationAction` の検証に渡す tx */
  readonly tx: { readonly update: Mock };
  /** `set(...)` の呼び出し。引数の検証に使う */
  readonly set: Mock;
  /** `where(...)` の呼び出し。失敗させたいテストは `mockRejectedValue` で上書きする */
  readonly where: Mock;
}

/**
 * 1 つの表を更新するトランザクションの偽物を作る
 * 更新トランザクションモック
 *
 * BAN・BAN 解除のように `tx.update(profiles).set(...).where(...)` を 1 回だけ
 * 発行する Server Action のテストで使う。`set` は自分の連鎖を返し、`where` は
 * 何も返さずに解決する。各テストの `beforeEach` で作り直す。
 */
export function createUpdateTxMock(): UpdateTxMock {
  const set = vi.fn();
  const where = vi.fn();
  const chain = { set, where };
  set.mockReturnValue(chain);
  where.mockResolvedValue(undefined);
  return { tx: { update: vi.fn(() => chain) }, set, where };
}

import { vi } from "vitest";

/**
 * Server Action の認証・レートリミット前処理のテスト用スタブ
 * 認証モック
 *
 * ログインを要求する Server Action は、どれも `enforceIpRateLimit` →
 * `authenticateAndCheckBan` の順に通ってから本体に入る。各テストが同じ
 * `vi.fn()` 生成・`vi.mock` 登録・「通過した状態」の初期化を書いていたので
 * ここへまとめる。
 *
 * このモジュールの export はモック対象の module 形にも揃えてあるため、
 * `vi.mock` のファクトリにそのまま渡せる:
 *
 * ```ts
 * vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));
 * vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));
 *
 * beforeEach(() => {
 *   vi.clearAllMocks();
 *   setupAuthorized();
 * });
 * ```
 *
 * 差し替えた module に余分な export が混じるが、対象の Server Action が
 * 読むのはそれぞれ1つだけなので影響しない。
 *
 * 拒否される側（レートリミット超過・BAN・未ログイン）を見たいテストは、
 * `setupAuthorized()` のあとに該当のモックだけ上書きすること。
 *
 * このモジュールはテスト専用。
 */

/** `@/lib/rate-limit-ip` の `enforceIpRateLimit` の差し替え先 */
export const mockEnforceIpRateLimit = vi.fn();

/** `@/lib/auth` の `authenticateAndCheckBan` の差し替え先 */
export const mockAuthenticateAndCheckBan = vi.fn();

/** `vi.mock("@/lib/rate-limit-ip", ...)` 用のエイリアス */
export const enforceIpRateLimit = mockEnforceIpRateLimit;

/** `vi.mock("@/lib/auth", ...)` 用のエイリアス */
export const authenticateAndCheckBan = mockAuthenticateAndCheckBan;

/** 認証を通過したときに返るユーザー */
export const AUTHENTICATED_USER = {
  id: "user-123",
  email: "user@example.com",
};

/**
 * 認証もレートリミットも通過した状態にする
 * 認証通過設定
 *
 * @param user - 認証結果として返すユーザー（既定 {@link AUTHENTICATED_USER}）
 */
export function setupAuthorized(user = AUTHENTICATED_USER): void {
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockAuthenticateAndCheckBan.mockResolvedValue({ user });
}

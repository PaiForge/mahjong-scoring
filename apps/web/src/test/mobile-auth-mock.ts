import { vi } from "vitest";

/**
 * アプリ向け API（`lib/mobile-api/`）の認証のテスト用スタブ
 * アプリAPI認証モック
 *
 * ハンドラはどれも `authorizeMobileRequest` を通ってから本体に入る。各テストが
 * 同じ `vi.fn()` 生成・`vi.mock` 登録・「通過した状態」の組み立てを書いていたので
 * ここへまとめる。export は `./auth` の module 形にも揃えてあるため、`vi.mock` の
 * ファクトリにそのまま渡せる:
 *
 * ```ts
 * vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
 *
 * beforeEach(() => {
 *   authorizeAs({ userId: "user-1", username: "bob" });
 * });
 * ```
 *
 * 拒否される側を見たいテストは {@link mockAuthorizeMobileRequest} を直接上書きする。
 *
 * このモジュールはテスト専用。
 */

/** `./auth` の `authorizeMobileRequest` の差し替え先 */
export const mockAuthorizeMobileRequest = vi.fn();

/** `vi.mock("./auth", ...)` 用のエイリアス */
export const authorizeMobileRequest = mockAuthorizeMobileRequest;

/** 認証を通ったことにするユーザー */
interface AuthorizedAs {
  readonly userId: string;
  /** ユーザー名。省略するとプロフィール未作成（ユーザー名を決めていない） */
  readonly username?: string;
  /** Apple の連携の sub。省略すると Apple でログインしたことが無い */
  readonly appleSubject?: string;
}

/**
 * `authorizeMobileRequest` が認証を通した結果を返すようにする
 *
 * @param as 通すユーザー
 */
export function authorizeAs({
  userId,
  username,
  appleSubject,
}: AuthorizedAs): void {
  mockAuthorizeMobileRequest.mockResolvedValue({
    ok: true,
    user: { id: userId },
    profile: username === undefined ? undefined : { username },
    appleSubject,
  });
}

import { vi } from "vitest";

/**
 * `useAuth`（認証コンテキスト）のテスト用スタブ
 * 認証コンテキストモック
 *
 * 認証コンテキストはサインアウトの Server Action を静的に import するため、
 * `server-only` のモジュールがクライアント側だけを描くテストの依存に紛れ込む。
 * トレーニングのシェル（末尾に昇級試験の受験ゲートを持つ）を描くテストは、
 * ゲートを実際に出さなくてもこのモックを噛ませないと読み込みで落ちる:
 *
 * ```ts
 * vi.mock(
 *   "@/app/_contexts/auth-context",
 *   async () => await import("@/test/auth-context-mock"),
 * );
 * ```
 *
 * 既定は「未ログイン・解決済み」。ログイン状態を見たいテストは
 * `useAuth.mockReturnValue(...)` で上書きする。
 *
 * このモジュールはテスト専用。
 */
export const useAuth = vi.fn(() => ({ user: undefined, isLoading: false }));

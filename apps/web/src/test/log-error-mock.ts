import { vi } from "vitest";

/**
 * `@/lib/log-error` のテスト用スタブ
 * エラーログモック
 *
 * 失敗を握り潰す経路のテストで、ログを標準エラーに流さずに「ログを出したか」
 * だけを見られるようにする:
 *
 * ```ts
 * vi.mock("@/lib/log-error", async () => await import("@/test/log-error-mock"));
 * ```
 *
 * 呼び出しを確かめるテストは、モック済みのモジュールから `logExternalError`
 * を import して見る。このモジュールはテスト専用。
 */

export const logExternalError = vi.fn();

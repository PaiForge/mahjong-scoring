/**
 * `next/navigation` のテスト用スタブ
 * ナビゲーションモック
 *
 * App Router のコンテキストが無いテスト環境では `useSearchParams()` が
 * null を返し、URL クエリを読むコンポーネント（トレーニングのチャレンジ
 * 導線など）を含むツリーがそれだけで落ちる。クエリの中身を見ないテストは
 * これを噛ませて空のクエリで描く:
 *
 * ```ts
 * vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
 * ```
 *
 * クエリを差し替えたいテストは、可変の値を返す独自のスタブを書くこと
 * （`training-shell.test.tsx` が例）。
 *
 * このモジュールはテスト専用。
 */

const EMPTY_SEARCH_PARAMS = new URLSearchParams();

/** 常に空のクエリを返す */
export function useSearchParams(): URLSearchParams {
  return EMPTY_SEARCH_PARAMS;
}

/**
 * `next/navigation` のテスト用スタブ
 * ナビゲーションモック
 *
 * App Router のコンテキストが無いテスト環境では `useSearchParams()` が
 * null を返し、URL クエリを読むコンポーネント（トレーニングのチャレンジ
 * 導線など）を含むツリーがそれだけで落ちる。`useRouter()` と
 * `usePathname()` も同様に、素の render では使えない。まとめて噛ませる:
 *
 * ```ts
 * vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
 * ```
 *
 * 遷移先を確かめたいテストは {@link routerPush} を、パスで表示が変わる
 * コンポーネントは {@link setPathname} を使う。一部だけ差し替えたい
 * テストは名前空間を展開して上書きする:
 *
 * ```ts
 * vi.mock("next/navigation", async () => ({
 *   ...(await import("@/test/navigation-mock")),
 *   useSearchParams: () => new URLSearchParams(currentQuery),
 * }));
 * ```
 *
 * このモジュールはテスト専用。
 */
import { vi } from "vitest";

const EMPTY_SEARCH_PARAMS = new URLSearchParams();

/** 常に空のクエリを返す */
export function useSearchParams(): URLSearchParams {
  return EMPTY_SEARCH_PARAMS;
}

/**
 * `router.push()` のスパイ。
 *
 * ファイル内で共有するため、遷移を検証するテストは `beforeEach` で
 * `vi.clearAllMocks()` するか、これ自身を `mockClear()` すること。
 */
export const routerPush = vi.fn();

/** push だけを持つ最小のルーター */
export function useRouter(): { push: typeof routerPush } {
  return { push: routerPush };
}

let currentPathname = "/";

/** `usePathname()` が返すパスを差し替える（遷移したことにする） */
export function setPathname(pathname: string): void {
  currentPathname = pathname;
}

/** {@link setPathname} で最後に設定したパスを返す */
export function usePathname(): string {
  return currentPathname;
}

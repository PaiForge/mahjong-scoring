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
 * コンポーネントは {@link setPathname} を、URL クエリで表示が変わる
 * コンポーネントは {@link setSearchParams} を使う。クエリはファイル内で
 * 持ち越すので、変えるテストは `beforeEach` で戻すこと。一部だけ差し替えたい
 * テストは名前空間を展開して上書きする:
 *
 * ```ts
 * vi.mock("next/navigation", async () => ({
 *   ...(await import("@/test/navigation-mock")),
 *   useParams: () => ({ slug: "jantou-fu" }),
 * }));
 * ```
 *
 * このモジュールはテスト専用。
 */
import { vi } from "vitest";

let currentSearchParams = new URLSearchParams();

/**
 * `useSearchParams()` が返すクエリを差し替える（その URL を開いたことにする）
 *
 * @param query `?` を除いたクエリ文字列（`"variant=all"` 等。空文字で空のクエリ）
 */
export function setSearchParams(query: string): void {
  currentSearchParams = new URLSearchParams(query);
}

/**
 * {@link setSearchParams} で最後に設定したクエリを返す（既定は空）
 *
 * 次に差し替えるまで同じオブジェクトを返す（本物と同じく、URL が変わらない
 * 間は参照が変わらない）。
 */
export function useSearchParams(): URLSearchParams {
  return currentSearchParams;
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

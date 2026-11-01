import {
  DOJO_PATH,
  LESSONS_PATH,
  PRACTICE_PATH,
} from "@mahjong-scoring/features/routes";

/**
 * 下部タブの入口のパス（`app/(tabs)/` の 5 画面）
 *
 * ホーム・道場・練習・レッスン・点数表。点数表はアプリだけのタブで、
 * features の routes に定数が無い。
 */
const TAB_PATHS: ReadonlySet<string> = new Set([
  "/",
  DOJO_PATH,
  PRACTICE_PATH,
  LESSONS_PATH,
  "/score-table",
]);

/**
 * 行き先がタブの入口か（クエリ・ハッシュは見ない）
 * タブのパス判定
 *
 * タブの入口へは `useGoToTab` で移る。ふつうの `push` / `navigate` で
 * 積んだ画面から送ると、タブ一式がもう 1 組積まれる。
 *
 * @param href - 行き先（`/practice?rank=kyu-5` のようなクエリ付きでよい）
 */
export function isTabHref(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0] ?? href;
  return TAB_PATHS.has(pathname);
}

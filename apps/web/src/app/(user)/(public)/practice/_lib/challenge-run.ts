import { z } from "zod";

/**
 * チャレンジの「回」の識別と、問題別結果の保存形式
 * チャレンジ回
 *
 * 結果ページの問題別一覧は sessionStorage を経由する。play 画面が終了時に
 * 書き、結果ページが読む。読んだ後も消さない — 消すと、結果ページから他の
 * ページへ移ってブラウザバックで戻ったときやリロードしたときに、再マウント
 * した一覧が空の sessionStorage を読んで消えてしまう。
 *
 * 消さない代わりに、保存した一覧がどの回のものかを URL と突き合わせる。
 * 同じ練習の別の回の結果 URL（履歴の古い方や共有された URL）を開いたとき、
 * URL のスコアと sessionStorage の一覧がズレたまま出るのを防ぐため。
 * 回の ID は終了時刻（{@link import("../_hooks/use-timed-session").FinalResult}
 * の `finishedAt`）で、`useRecordedResults` が保存する封筒と
 * `useFinishRedirect` が組む URL の `?run=` に同じ値が入る。
 *
 * 保存されるのは練習ごとに最新の 1 回分だけ（キーが練習スラッグごとに固定で、
 * 次の回が上書きする）。タブを閉じれば消える。
 */

/** 結果ページの URL で回 ID を運ぶクエリパラメータ名 */
export const RUN_PARAM = "run";

/**
 * URL クエリの値を回 ID として読む
 * 回 ID パース
 *
 * 付いていない・壊れているときは undefined（どの回か分からない）。
 */
export function parseRunId(value: unknown): number | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

/**
 * sessionStorage に保存する封筒
 * 保存封筒
 *
 * `results` の要素の形は練習ごとに違うので、ここでは配列であることだけを
 * 見る。要素の選別は各練習のパーサ（`createSessionStorageParser`）の担当
 */
const storedResultsSchema = z.object({
  run: z.number(),
  results: z.array(z.unknown()),
});

/**
 * 問題別結果を回 ID 付きで保存用の文字列にする
 * 結果封入
 */
export function packStoredResults(
  run: number,
  results: readonly unknown[],
): string {
  return JSON.stringify({ run, results });
}

/**
 * 保存用の文字列から、指定した回の問題別結果を取り出す
 * 結果開封
 *
 * 保存が無い・壊れている・別の回のものなら undefined。回が分からない
 * （URL に `?run=` が無い）ときも undefined — どの回の一覧か確かめようが
 * ないので出さない。
 *
 * @param raw - sessionStorage の生文字列。無ければ undefined
 * @param run - 結果ページの URL が指す回 ID。分からなければ undefined
 */
export function unpackStoredResults(
  raw: string | undefined,
  run: number | undefined,
): readonly unknown[] | undefined {
  if (raw === undefined || run === undefined) return undefined;
  try {
    const parsed = storedResultsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.run !== run) return undefined;
    return parsed.data.results;
  } catch {
    return undefined;
  }
}

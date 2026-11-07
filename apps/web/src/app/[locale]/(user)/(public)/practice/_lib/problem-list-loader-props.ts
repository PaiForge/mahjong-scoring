import type { ReactNode } from "react";

/**
 * 問題別フィードバック一覧 Loader の共通 props
 * 問題一覧ローダープロパティ
 *
 * Server Component（`createCustomResultView`）から Client Component の Loader へ
 * 渡すため、シリアライズ可能な値（primitive と Server 側で描画済みの要素）のみで構成する。
 */
export interface ProblemListLoaderProps {
  /** sessionStorage のキー */
  readonly storageKey: string;
  /**
   * 結果ページの URL が指す回 ID（`?run=`）。保存の回 ID と一致する一覧だけを
   * 出す。付いていない・壊れているときは undefined で、一覧は空になる
   */
  readonly runId: number | undefined;
  /**
   * 一覧に並ぶ問題数（URL クエリ `?total=` と `?reason=` から
   * `listedProblemCount` で出す）。
   * sessionStorage の読み取り完了までに確保する placeholder の行数に使う。
   */
  readonly expectedCount: number;
  /**
   * 一覧の末尾に置く要素（結果画面の主ボタン）。一覧が空のとき（別の回の URL・
   * sessionStorage が使えない環境）は出さない — 一覧が無いと広告の直後に
   * ボタン群と同じボタンが並ぶだけになる
   */
  readonly footer?: ReactNode;
}

/**
 * 問題別フィードバック一覧 Loader の共通 props
 * 問題一覧ローダープロパティ
 *
 * Server Component（`createCustomResultView`）から Client Component の Loader へ
 * 渡すため、シリアライズ可能な primitive のみで構成する。
 */
export interface ProblemListLoaderProps {
  /** sessionStorage のキー */
  readonly storageKey: string;
  /**
   * 出題数（URL クエリ `?total=`）。
   * sessionStorage の読み取り完了までに確保する placeholder の行数に使う。
   */
  readonly expectedCount: number;
}

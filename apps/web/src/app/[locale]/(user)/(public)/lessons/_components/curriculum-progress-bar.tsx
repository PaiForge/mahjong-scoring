import {
  CurriculumProgressBarView,
  type CurriculumProgressBarViewProps,
} from "./curriculum-progress-bar-view";

/**
 * カリキュラム全体の学習進捗を示すバー。完了したレッスンの比率を可視化する。
 * 学習進捗バー
 *
 * サーバーの呼び出し元（ダッシュボード）向けの入口。描画は
 * {@link CurriculumProgressBarView}（クライアント）にあり、`/lessons` は本人の
 * 完了をクライアントで取って上書きするためそちらを直接描く。ここは props を
 * そのまま渡すだけで、Provider の無い場所では props の値が出る。
 *
 * @param completedCount 完了したレッスンの数
 * @param totalCount レッスンの総数
 * @param allCompleted すべて完了したか
 */
export function CurriculumProgressBar(props: CurriculumProgressBarViewProps) {
  return <CurriculumProgressBarView {...props} />;
}

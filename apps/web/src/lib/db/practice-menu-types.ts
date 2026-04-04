/**
 * ドリル種別の型定義
 *
 * チャレンジモード（ランキング対応）のドリル種別を定義する。
 * `challenge_results` / `challenge_best_scores` テーブルの `menu_type` カラムに格納される値。
 *
 * @design menuType — ドリル種別
 *
 * - 'jantou_fu': 雀頭の符計算
 * - 'machi_fu': 待ちの符計算
 * - 'mentsu_fu': 面子の符計算
 * - 'tehai_fu': 手牌の符計算
 * - 'yaku': 役判定
 * - 'score_table': 点数表早引き
 * - 'score_calculation': 点数計算ドリル
 * - 'han_count': 翻数即答
 *
 * `practice/score` は自由練習のため記録対象外。
 */
export const PRACTICE_MENU_TYPES = [
  'jantou_fu',
  'machi_fu',
  'mentsu_fu',
  'tehai_fu',
  'yaku',
  'score_table',
  'score_calculation',
  'han_count',
] as const;

export type PracticeMenuType = (typeof PRACTICE_MENU_TYPES)[number];

const practiceMenuTypeSet: ReadonlySet<string> = new Set(PRACTICE_MENU_TYPES);

/** 値が有効なドリル種別かを判定する型ガード */
export function isPracticeMenuType(value: unknown): value is PracticeMenuType {
  return typeof value === 'string' && practiceMenuTypeSet.has(value);
}

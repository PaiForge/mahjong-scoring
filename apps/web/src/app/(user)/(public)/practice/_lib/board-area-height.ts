/**
 * 解いている画面の盤面エリア（手牌 + 設問 + 選択肢）の高さ
 * 盤面エリア高さ
 *
 * 牌の画像と選択肢の数で決まり、行数や文字数からは導けないため実測値を名前で
 * 持つ。牌は列の幅に合わせて縮むので高さは幅で変わる。狭い画面のぶんも
 * 持たないとモバイルで 20〜30px ずれるため、列が 358px になる <sm と 512px に
 * なる sm 以上の 2 点で測った値を持つ（2026-09 実測）。
 *
 * - `standard`: 点数を select で答える試験。<sm 326〜336px / sm 以上 347〜356px。
 *   どちらも真ん中を取っている
 * - `tall`: 合計符の試験。選択肢が 11 個並ぶため一段高い（<sm 458px / sm 以上 489px）
 *
 * この値は「盤面がまだ無い間に場所を確保する」全員が共有する:
 *
 * - `loading.tsx` のフォールバック（{@link import("../_components/practice-play-loading-fallback").PracticePlayLoadingFallback}）
 * - 出題の生成待ち（{@link import("../_components/question-generating-placeholder").QuestionGeneratingPlaceholder}）
 *
 * 別々の値を持つと、スケルトン → 生成中 → 実体 の 3 段で画面が 2 回跳ねる。
 */
export const BOARD_AREA_HEIGHT = {
  standard: "h-[331px] sm:h-[351px]",
  tall: "h-[458px] sm:h-[489px]",
} as const;

/** 盤面エリアの高さの種類 */
export type PlayBoardHeight = keyof typeof BOARD_AREA_HEIGHT;

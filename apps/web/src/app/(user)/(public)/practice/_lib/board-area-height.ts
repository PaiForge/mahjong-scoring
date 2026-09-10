import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

/**
 * 点数を select で答える試験 5 種。構図が同じで高さも揃う。点数即答と同じ
 * 部品の並びなので値も同じ。模試（`/exam/<級>/training`）は盤面をカード上端に
 * 密着させて上枠を落とすぶん <sm で 3px 低いが、表は本番の値を持つ
 */
const SCORE_EXAM = "h-[266px] sm:h-[286px]";

/**
 * 解いている画面の盤面エリア（手牌 + 設問 + 選択肢）の高さ
 * 盤面エリア高さ
 *
 * 牌の画像と選択肢の数で決まり、行数や文字数からは導けないため実測値を名前で
 * 持つ。牌も選択肢も列の幅に合わせて畳まれるので高さは幅で変わる。片方しか
 * 持たないと最大 147px ずれるため（役判定の 591px と 738px）、列が 358px に
 * なる <sm と 512px 以上になる sm 以上の 2 点で測った値を持つ（2026-09 実測、
 * 幅 390px / 1280px）。盤面を作り替えたら測り直すこと。
 *
 * 手牌の段は幅から高さを決めるため（`TehaiHand` 参照）、同じ幅なら出題が
 * 変わっても盤面の高さは変わらない。例外は満貫以上点数計算（成立役の一覧の
 * 行数で変わる）だけ。
 *
 * この値は「盤面がまだ無い間に場所を確保する」全員が共有する:
 *
 * - `loading.tsx` のフォールバック（{@link import("../_components/practice-play-loading-fallback").PracticePlayLoadingFallback}）
 * - 出題の生成待ち（{@link import("../_components/question-generating-placeholder").QuestionGeneratingPlaceholder}）
 *
 * 別々の値を持つと、スケルトン → 生成中 → 実体 の 3 段で画面が 2 回跳ねる。
 */
export const BOARD_AREA_HEIGHT = {
  scoreExam: SCORE_EXAM,
  /** 合計符の試験。選択肢が 11 個並ぶため一段高い */
  fuExam: "h-[458px] sm:h-[489px]",
  scoreCalculation: "h-[266px] sm:h-[286px]",
  /**
   * 成立役の一覧の行数で変わる（実測 426〜522px）ため一致させられない。
   * 最も低い側（役 1 行）に置く。理由はスケルトン側の `manganScoreCalculation` 参照
   */
  manganScoreCalculation: "h-[426px] sm:h-[446px]",
  jantouFu: "h-[320px]",
  machiFu: "h-[339px] sm:h-[343px]",
  mentsuFu: "h-[305px] sm:h-[313px]",
  /** 面子と雀頭を 1 問で答えるため、符目の行が縦に積み上がって最も高い */
  mentsuJantouFu: "h-[805px] sm:h-[820px]",
  totalFu: "h-[458px] sm:h-[489px]",
  yaku: "h-[591px] sm:h-[738px]",
  /** 選択肢が広い画面で横に並ぶぶん、sm 以上の方が低い */
  hanCount: "h-[428px] sm:h-[382px]",
  /** 手牌を持たず条件だけを出すため最も低い */
  scoreTable: "h-[268px]",
  yakuHan: "h-[322px] sm:h-[256px]",
} as const;

/** 盤面エリアの高さの種類 */
export type PlayBoardHeight = keyof typeof BOARD_AREA_HEIGHT;

/**
 * 練習ごとの盤面エリアの高さ
 * 練習別盤面高さ
 *
 * `loading.tsx` は練習のスラッグしか知らない（盤面の形は play 画面の持ち物で
 * レジストリには無い）ため、ここで引き当てる。盤面側は自分の高さを直接渡す。
 *
 * 未登録の練習は既定（{@link BOARD_AREA_HEIGHT.scoreExam}）で待つ。
 */
export const BOARD_HEIGHT_BY_SLUG: Readonly<
  Partial<Record<PracticeMenuSlug, PlayBoardHeight>>
> = {
  "mangan-exam": "scoreExam",
  "chiitoitsu-exam": "scoreExam",
  "pinfu-exam": "scoreExam",
  "fu-score-exam": "scoreExam",
  "score-exam": "scoreExam",
  "fu-exam": "fuExam",
  "score-calculation": "scoreCalculation",
  "mangan-score-calculation": "manganScoreCalculation",
  "jantou-fu": "jantouFu",
  "machi-fu": "machiFu",
  "mentsu-fu": "mentsuFu",
  "mentsu-jantou-fu": "mentsuJantouFu",
  "total-fu": "totalFu",
  yaku: "yaku",
  "han-count": "hanCount",
  "score-table": "scoreTable",
  "yaku-han": "yakuHan",
};

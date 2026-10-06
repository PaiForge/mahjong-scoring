/**
 * 道場のヘルプツアーが照らす要素の `data-tour-id`
 * 道場ツアー ID
 *
 * 要素を描くサーバーコンポーネント（ページ・級の行程カード）と、ツアーの
 * 手順を組むクライアントコンポーネントの両方から読むため、値をここに置く。
 */
export const DOJO_TOUR_ID = {
  /** 現在の段級位の区切りバー */
  currentRank: "dojo-current-rank",
  /** 次の目標の級の見出し行（帯・級名・状態） */
  nextRankHeader: "dojo-next-rank-header",
  /** 次の目標の級の進み具合（学ぶ・練習する・試験） */
  nextRankStages: "dojo-next-rank-stages",
  /** 黒帯への道の見出し（黒帯 = 何の認定かを説明する） */
  journeyTitle: "dojo-journey-title",
  /** 未取得の上位級の施錠の注記（最初の 1 つを照らす） */
  lockedNote: "dojo-locked-note",
} as const;

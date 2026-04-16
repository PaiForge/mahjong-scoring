import {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";

/**
 * 利用可能な点数リストを取得する
 * 翻数・親子・ツモロンに応じてフィルタリングした点数候補を返す
 *
 * @param han - 選択された翻数（未選択の場合は undefined）
 * @param isOya - 親かどうか
 * @param isTsumo - ツモかどうか
 * @param manganOnly - true の場合、翻数にかかわらず満貫以上の点数のみ返す
 */
export function getAvailableScores(
  han: number | undefined,
  isOya: boolean,
  isTsumo: boolean,
  manganOnly?: boolean,
): AvailableScores {
  const isKoTsumo = isTsumo && !isOya;

  if (isKoTsumo) {
    return {
      type: "koTsumo",
      koScores: filterByHan(TSUMO_SCORES_KO_PART, han, "tsumoKo", manganOnly),
      oyaScores: filterByHan(TSUMO_SCORES_OYA_PART, han, "tsumoOya", manganOnly),
    };
  }

  if (isOya && isTsumo) {
    return {
      type: "single",
      scores: filterByHan(TSUMO_SCORES_OYA_PART, han, "tsumoOyaAll", manganOnly),
    };
  }

  if (isOya) {
    return {
      type: "single",
      scores: filterByHan(RON_SCORES_OYA, han, "ronOya", manganOnly),
    };
  }

  return {
    type: "single",
    scores: filterByHan(RON_SCORES_KO, han, "ronKo", manganOnly),
  };
}

interface KoTsumoScores {
  readonly type: "koTsumo";
  readonly koScores: readonly number[];
  readonly oyaScores: readonly number[];
}

interface SingleScores {
  readonly type: "single";
  readonly scores: readonly number[];
}

/** 利用可能な点数 */
type AvailableScores = KoTsumoScores | SingleScores;
export type { AvailableScores };

type ScoreCategory =
  | "ronKo"
  | "ronOya"
  | "tsumoKo"
  | "tsumoOya"
  | "tsumoOyaAll";

const MANGAN_THRESHOLDS: Readonly<Record<ScoreCategory, number>> = {
  ronKo: 8000,
  ronOya: 12000,
  tsumoKo: 2000,
  tsumoOya: 4000,
  tsumoOyaAll: 4000,
};

function filterByHan(
  scores: readonly number[],
  han: number | undefined,
  category: ScoreCategory,
  manganOnly?: boolean,
): readonly number[] {
  const threshold = MANGAN_THRESHOLDS[category];

  if (manganOnly) {
    return scores.filter((s) => s >= threshold);
  }

  if (han === undefined) return scores;

  if (han >= 5) {
    return scores.filter((s) => s >= threshold);
  }
  if (han <= 3) {
    return scores.filter((s) => s < threshold);
  }
  return scores;
}

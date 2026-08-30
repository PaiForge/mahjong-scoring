import type { ScoreRange } from "@mahjong-scoring/core";
import {
  koScoreFromBasePoints,
  oyaScoreFromBasePoints,
  MANGAN_BASE_POINTS,
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";
import { MANGAN_MIN_HAN } from "./han-tiers";

/**
 * 利用可能な点数リストを取得する
 * 翻数・親子・ツモロンに応じてフィルタリングした点数候補を返す
 *
 * @param han - 選択された翻数（未選択の場合は undefined）
 * @param isOya - 親かどうか
 * @param isTsumo - ツモかどうか
 * @param scoreRange - 指定すると、翻数にかかわらずその点数帯の点数のみ返す
 * @param kiriageMangan - 切り上げ満貫を採用しているか（3翻でも満貫がありうる）
 */
export function getAvailableScores(
  han: number | undefined,
  isOya: boolean,
  isTsumo: boolean,
  scoreRange?: ScoreRange,
  kiriageMangan?: boolean,
): AvailableScores {
  const isKoTsumo = isTsumo && !isOya;

  if (isKoTsumo) {
    return {
      type: "koTsumo",
      koScores: filterScores(
        TSUMO_SCORES_KO_PART,
        han,
        "tsumoKo",
        scoreRange,
        kiriageMangan,
      ),
      oyaScores: filterScores(
        TSUMO_SCORES_OYA_PART,
        han,
        "tsumoOya",
        scoreRange,
        kiriageMangan,
      ),
    };
  }

  if (isOya && isTsumo) {
    return {
      type: "single",
      scores: filterScores(
        TSUMO_SCORES_OYA_PART,
        han,
        "tsumoOyaAll",
        scoreRange,
        kiriageMangan,
      ),
    };
  }

  if (isOya) {
    return {
      type: "single",
      scores: filterScores(
        RON_SCORES_OYA,
        han,
        "ronOya",
        scoreRange,
        kiriageMangan,
      ),
    };
  }

  return {
    type: "single",
    scores: filterScores(
      RON_SCORES_KO,
      han,
      "ronKo",
      scoreRange,
      kiriageMangan,
    ),
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
  "ronKo" | "ronOya" | "tsumoKo" | "tsumoOya" | "tsumoOyaAll";

/**
 * 満貫の点数（選択肢を満貫以上に絞る際のしきい値）
 *
 * 8000 / 12000 等を直書きせず、満貫の基本符から core と同じ式で導出する。
 * 親ツモは「全員から同額」なので tsumoOya と tsumoOyaAll は同じ値になる。
 */
const MANGAN_THRESHOLDS: Readonly<Record<ScoreCategory, number>> = (() => {
  const ko = koScoreFromBasePoints(MANGAN_BASE_POINTS);
  const oya = oyaScoreFromBasePoints(MANGAN_BASE_POINTS);
  return {
    ronKo: ko.ron,
    ronOya: oya.ron,
    tsumoKo: ko.tsumo.fromKo,
    tsumoOya: ko.tsumo.fromOya,
    tsumoOyaAll: oya.tsumo.all,
  };
})();

function filterScores(
  scores: readonly number[],
  han: number | undefined,
  category: ScoreCategory,
  scoreRange?: ScoreRange,
  kiriageMangan?: boolean,
): readonly number[] {
  const threshold = MANGAN_THRESHOLDS[category];

  // 点数帯が決まっている出題（昇級試験）は翻数を見ない。翻数で絞ると
  // 選択肢の個数そのものが翻数のヒントになるうえ、切り上げ満貫の設定
  // （下の `boundary`）で選択肢が端末ごとに変わってしまう
  if (scoreRange === "manganPlus") {
    return scores.filter((s) => s >= threshold);
  }
  if (scoreRange === "nonMangan") {
    return scores.filter((s) => s < threshold);
  }

  if (han === undefined) return scores;

  if (han >= MANGAN_MIN_HAN) {
    return scores.filter((s) => s >= threshold);
  }
  // 満貫の1つ下の翻（4翻）は符次第で満貫にも満貫未満にもなるため絞り込まない。
  // 切り上げ満貫ではさらに1つ下の翻（3翻）も60符で満貫になるため、絞らない範囲を広げる
  const boundary = MANGAN_MIN_HAN - (kiriageMangan ? 2 : 1);
  if (han < boundary) {
    return scores.filter((s) => s < threshold);
  }
  return scores;
}

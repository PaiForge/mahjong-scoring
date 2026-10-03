import type { ScoreRange } from "@mahjong-scoring/core";
import {
  calculateTierScore,
  MANGAN_PLUS_TIERS,
  paymentKindOf,
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";
import { MANGAN_MIN_HAN } from "./han-tiers";

/**
 * 回答の選択肢を固定する範囲
 * 選択肢範囲
 *
 * 点数帯（満貫未満 / 満貫以上）に加えて、絞らない `"all"` を持つ。
 * `undefined`（範囲を渡さない）とは別物で、`undefined` は「翻数から絞る」、
 * `"all"` は「その親子・ツモロンで取りうる全点数を出す」。出題範囲を絞らない
 * 試験（どんな手でも出す試験）が `"all"` を渡す。
 */
export type ScoreOptionRange = ScoreRange | "all";

/**
 * 利用可能な点数リストを取得する
 * 翻数・親子・ツモロンに応じてフィルタリングした点数候補を返す
 *
 * @param han - 選択された翻数（未選択の場合は undefined）
 * @param isOya - 親かどうか
 * @param isTsumo - ツモかどうか
 * @param scoreRange - 指定すると、翻数にかかわらずその範囲の点数のみ返す
 * @param kiriageMangan - 切り上げ満貫を採用しているか（3翻でも満貫がありうる）
 * @param doubleYakuman - ダブル役満を採用したルールでの出題か。採用時のみ
 *   ダブル役満の点数（子64000点等）を選択肢に足す。昇級試験は端末ローカル
 *   設定で選択肢が変わってはならないため渡さない
 */
export function getAvailableScores(
  han: number | undefined,
  isOya: boolean,
  isTsumo: boolean,
  scoreRange?: ScoreOptionRange,
  kiriageMangan?: boolean,
  doubleYakuman?: boolean,
): AvailableScores {
  const paymentKind = paymentKindOf(isOya, isTsumo);
  const scoresFor = (
    scores: readonly number[],
    category: ScoreCategory,
  ): readonly number[] =>
    doubleYakuman ? [...scores, DOUBLE_YAKUMAN_SCORES[category]] : scores;

  if (paymentKind === "koTsumo") {
    return {
      type: "koTsumo",
      koScores: filterScores(
        scoresFor(TSUMO_SCORES_KO_PART, "tsumoKo"),
        han,
        "tsumoKo",
        scoreRange,
        kiriageMangan,
      ),
      oyaScores: filterScores(
        scoresFor(TSUMO_SCORES_OYA_PART, "tsumoOya"),
        han,
        "tsumoOya",
        scoreRange,
        kiriageMangan,
      ),
    };
  }

  if (paymentKind === "oyaTsumo") {
    return {
      type: "single",
      scores: filterScores(
        scoresFor(TSUMO_SCORES_OYA_PART, "tsumoOyaAll"),
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
        scoresFor(RON_SCORES_OYA, "ronOya"),
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
      scoresFor(RON_SCORES_KO, "ronKo"),
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
 * 満貫以上の点数区分の点数をカテゴリごとに引く
 *
 * 8000 / 12000 / 64000 等を直書きせず、core の区分テーブル
 * （`MANGAN_PLUS_TIERS`）からライブラリに計算させる。
 * 親ツモは「全員から同額」なので tsumoOya と tsumoOyaAll は同じ値になる。
 */
function tierScoresByCategory(
  tierKey: string,
): Readonly<Record<ScoreCategory, number>> {
  const tier = MANGAN_PLUS_TIERS.find((t) => t.key === tierKey);
  if (!tier) throw new Error(`MANGAN_PLUS_TIERS に ${tierKey} の区分がない`);
  const { ko, oya } = calculateTierScore(tier);
  return {
    ronKo: ko.ron,
    ronOya: oya.ron,
    tsumoKo: ko.tsumo.fromKo,
    tsumoOya: ko.tsumo.fromOya,
    tsumoOyaAll: oya.tsumo.all,
  };
}

/** 満貫の点数（選択肢を満貫以上に絞る際のしきい値） */
const MANGAN_THRESHOLDS = tierScoresByCategory("mangan");

/**
 * ダブル役満採用時に選択肢へ足す点数
 *
 * 点数リスト（`RON_SCORES_KO` 等）は役満（32000等）までしか持たないため、
 * 採用時にカテゴリごとの1点を足す。
 */
const DOUBLE_YAKUMAN_SCORES = tierScoresByCategory("doubleYakuman");

function filterScores(
  scores: readonly number[],
  han: number | undefined,
  category: ScoreCategory,
  scoreRange?: ScoreOptionRange,
  kiriageMangan?: boolean,
): readonly number[] {
  const threshold = MANGAN_THRESHOLDS[category];

  // 範囲が決まっている出題（昇級試験）は翻数を見ない。翻数で絞ると
  // 選択肢の個数そのものが翻数のヒントになるうえ、切り上げ満貫の設定
  // （下の `boundary`）で選択肢が端末ごとに変わってしまう
  if (scoreRange === "all") {
    return scores;
  }
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

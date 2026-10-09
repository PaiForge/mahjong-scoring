import type { KoTsumoPayment, ScoreRange } from "@mahjong-scoring/core";
import {
  calculateTierScore,
  compareNumbers,
  koTsumoPaymentOptions,
  LOWEST_MANGAN_REACHABLE_HAN,
  MANGAN_PLUS_TIERS,
  paymentKindOf,
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";
import {
  DEFAULT_KO_TSUMO_INPUT,
  type KoTsumoInputMode,
} from "../../settings/ko-tsumo-input";
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
 * 点数の選択肢を絞る条件
 * 点数選択肢の条件
 */
export interface AvailableScoresParams {
  /** 選択された翻数（未選択の場合は undefined） */
  readonly han: number | undefined;
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 指定すると、翻数にかかわらずその範囲の点数のみ返す */
  readonly scoreRange?: ScoreOptionRange;
  /**
   * 切り上げ満貫を採用しているか。子ツモの組の集合だけが変わる
   * （60符3翻・30符4翻の 2000/3900 が満貫の 2000/4000 に吸収される）
   */
  readonly kiriageMangan?: boolean;
  /**
   * ダブル役満を採用したルールでの出題か。採用時のみダブル役満の点数
   * （子64000点等）を選択肢に足す。昇級試験は端末ローカル設定で選択肢が
   * 変わってはならないため渡さない
   */
  readonly doubleYakuman?: boolean;
  /** 子ツモの入力方式（既定 {@link DEFAULT_KO_TSUMO_INPUT}） */
  readonly koTsumoInput?: KoTsumoInputMode;
}

/**
 * 利用可能な点数リストを取得する
 * 翻数・親子・ツモロンに応じてフィルタリングした点数候補を返す
 *
 * どの絞り方でも、その条件で出題されうる正解は必ず選択肢に残す
 * （`get-available-scores.test.ts` が全セル・全区分で検査する）。
 */
export function getAvailableScores({
  han,
  isOya,
  isTsumo,
  scoreRange,
  kiriageMangan = false,
  doubleYakuman = false,
  koTsumoInput = DEFAULT_KO_TSUMO_INPUT,
}: AvailableScoresParams): AvailableScores {
  const paymentKind = paymentKindOf(isOya, isTsumo);
  const band = scoreBandOf(han, scoreRange);
  const scoresFor = (
    scores: readonly number[],
    category: ScoreCategory,
  ): readonly number[] =>
    filterScores(
      doubleYakuman ? [...scores, DOUBLE_YAKUMAN_SCORES[category]] : scores,
      category,
      band,
    );

  if (paymentKind === "koTsumo") {
    const payments = koTsumoPaymentOptions({
      kiriageMangan,
      doubleYakuman,
    }).filter((payment) => inBand(isManganPlusPayment(payment), band));
    if (koTsumoInput === "combined") {
      return { type: "koTsumoCombined", payments };
    }
    // 2 つの select は互いに連動しないので、実在する組の片側を必ず残す。
    // 2000/3900（切り上げ満貫なしの 60符3翻・30符4翻）は子の 2000 が満貫の
    // しきい値に乗り、点数リストを値だけで絞ると満貫未満の側から落ちる
    return {
      type: "koTsumoSplit",
      koScores: mergeScores(
        scoresFor(TSUMO_SCORES_KO_PART, "tsumoKo"),
        payments.map((p) => p.fromKo),
      ),
      oyaScores: mergeScores(
        scoresFor(TSUMO_SCORES_OYA_PART, "tsumoOya"),
        payments.map((p) => p.fromOya),
      ),
    };
  }

  if (paymentKind === "oyaTsumo") {
    return {
      type: "single",
      scores: scoresFor(TSUMO_SCORES_OYA_PART, "tsumoOyaAll"),
    };
  }

  return isOya
    ? { type: "single", scores: scoresFor(RON_SCORES_OYA, "ronOya") }
    : { type: "single", scores: scoresFor(RON_SCORES_KO, "ronKo") };
}

/** 子ツモを 2 つの select で答える選択肢 */
interface KoTsumoSplitScores {
  readonly type: "koTsumoSplit";
  readonly koScores: readonly number[];
  readonly oyaScores: readonly number[];
}

/** 子ツモを「子/親」の組の 1 つの select で答える選択肢 */
interface KoTsumoCombinedScores {
  readonly type: "koTsumoCombined";
  readonly payments: readonly KoTsumoPayment[];
}

interface SingleScores {
  readonly type: "single";
  readonly scores: readonly number[];
}

/** 利用可能な点数 */
type AvailableScores =
  KoTsumoSplitScores | KoTsumoCombinedScores | SingleScores;
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

/**
 * 選択肢に残す点数帯
 *
 * `both` は満貫未満・満貫以上の両方を残す（翻数だけでは決まらないとき）。
 */
type ScoreBand = "nonMangan" | "manganPlus" | "both";

/**
 * 範囲と翻数から、選択肢に残す点数帯を決める
 *
 * 範囲が決まっている出題（昇級試験）は翻数を見ない。翻数で絞ると選択肢の
 * 個数そのものが翻数のヒントになるうえ、端末ごとに選択肢が変わってしまう。
 *
 * 翻数で絞るときは、符によっては満貫に届く翻数（3・4翻）で両方を残す。
 * 切り上げ満貫を採らなくても 70符3翻は満貫になるため、切り上げ満貫の
 * 採否で境目は変わらない（{@link LOWEST_MANGAN_REACHABLE_HAN}）。
 */
function scoreBandOf(
  han: number | undefined,
  scoreRange: ScoreOptionRange | undefined,
): ScoreBand {
  if (scoreRange === "all") return "both";
  if (scoreRange !== undefined) return scoreRange;
  if (han === undefined) return "both";
  if (han >= MANGAN_MIN_HAN) return "manganPlus";
  if (han < LOWEST_MANGAN_REACHABLE_HAN) return "nonMangan";
  return "both";
}

function inBand(isManganPlus: boolean, band: ScoreBand): boolean {
  if (band === "both") return true;
  return band === "manganPlus" ? isManganPlus : !isManganPlus;
}

/**
 * 子ツモの組が満貫以上か
 *
 * 子・親の両方が満貫の支払いに届いているかで見る。子の値だけで見ると、
 * 2000/3900（満貫未満）が満貫の 2000/4000 と同じ側に入る。
 */
function isManganPlusPayment(payment: KoTsumoPayment): boolean {
  return (
    payment.fromKo >= MANGAN_THRESHOLDS.tsumoKo &&
    payment.fromOya >= MANGAN_THRESHOLDS.tsumoOya
  );
}

function filterScores(
  scores: readonly number[],
  category: ScoreCategory,
  band: ScoreBand,
): readonly number[] {
  const threshold = MANGAN_THRESHOLDS[category];
  return scores.filter((s) => inBand(s >= threshold, band));
}

/** 2 つの点数リストを重複なく昇順にまとめる */
function mergeScores(
  scores: readonly number[],
  extra: readonly number[],
): readonly number[] {
  return [...new Set([...scores, ...extra])].sort(compareNumbers);
}

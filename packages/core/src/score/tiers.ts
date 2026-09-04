import { ScoreLevel } from "../core/constants";

type ScoreLevelValue = (typeof ScoreLevel)[keyof typeof ScoreLevel];

/**
 * 満貫以上の点数区分（1区分分の定義）
 * 点数区分
 */
export interface HanTier {
  readonly level: ScoreLevelValue;
  /** i18n・データ参照用のキー（HIGH_SCORES の nameKey と一致） */
  readonly key: string;
  /** この区分に到達する最小翻数 */
  readonly minHan: number;
  /** 日本語名 */
  readonly nameJa: string;
}

/**
 * 満貫以上の点数区分テーブル（翻数しきい値の降順）
 * 点数区分テーブル
 *
 * 翻数→点数区分のしきい値（5/6/8/11/13/26翻）の唯一の定義。
 * 点数表出題・翻数簡略化はすべてこのテーブルから導出する。各区分の点数は
 * ここに持たず、ライブラリに計算させる（`calculateTierScore`）。
 */
export const MANGAN_PLUS_TIERS: readonly HanTier[] = [
  {
    level: ScoreLevel.DoubleYakuman,
    key: "doubleYakuman",
    minHan: 26,
    nameJa: "ダブル役満",
  },
  {
    level: ScoreLevel.Yakuman,
    key: "yakuman",
    minHan: 13,
    nameJa: "役満",
  },
  {
    level: ScoreLevel.Sanbaiman,
    key: "sanbaiman",
    minHan: 11,
    nameJa: "三倍満",
  },
  {
    level: ScoreLevel.Baiman,
    key: "baiman",
    minHan: 8,
    nameJa: "倍満",
  },
  {
    level: ScoreLevel.Haneman,
    key: "haneman",
    minHan: 6,
    nameJa: "跳満",
  },
  {
    level: ScoreLevel.Mangan,
    key: "mangan",
    minHan: 5,
    nameJa: "満貫",
  },
];

/**
 * 満貫に到達する最小翻数。これ以上なら（符によらず）満貫以上。
 * 満貫しきい値
 *
 * 満貫は {@link MANGAN_PLUS_TIERS} で最も翻数の低い区分なので最小値を引く。
 */
export const MANGAN_MIN_HAN = Math.min(
  ...MANGAN_PLUS_TIERS.map((tier) => tier.minHan),
);

/**
 * 役満を表す翻数。ダブル役満相当の翻数もこの値に丸めて扱う。
 * 役満翻数
 */
export const YAKUMAN_HAN = (() => {
  const yakuman = MANGAN_PLUS_TIERS.find((tier) => tier.key === "yakuman");
  if (!yakuman) throw new Error("MANGAN_PLUS_TIERS に役満の区分がない");
  return yakuman.minHan;
})();

/**
 * 13翻以上を役満の翻数（{@link YAKUMAN_HAN}）に丸める
 * 役満翻数丸め
 *
 * ダブル役満相当の翻数（26翻以上）も数え役満超えの翻数もすべて役満として
 * 扱う、というアプリ全体の決定（{@link DISPLAY_TIERS} のコメント参照）の
 * 計算面の実装。翻数の表示・判定で「役満か否か」より細かい区別をしない
 * 箇所はこれを通す。
 */
export function clampHanToYakuman(han: number): number {
  return Math.min(han, YAKUMAN_HAN);
}

/**
 * 翻数から満貫以上の点数区分を引く（満貫未満は undefined）
 * 点数区分特定
 */
export function scoreTierForHan(han: number): HanTier | undefined {
  return MANGAN_PLUS_TIERS.find((tier) => han >= tier.minHan);
}

/**
 * 早見表・学習ページで表示する満貫以上の区分（翻数の昇順）
 * 表示用点数区分
 *
 * ダブル役満を除く。26 翻以上も役満として扱い、役満を上限なしの帯にする。
 */
export const DISPLAY_TIERS: readonly HanTier[] = [
  ...MANGAN_PLUS_TIERS.filter((tier) => tier.key !== "doubleYakuman"),
].reverse();

/** 区分が占める翻数の範囲（上限なしは max: undefined） */
export interface HanRange {
  readonly min: number;
  readonly max: number | undefined;
}

/**
 * 区分が占める翻数の範囲を返す
 * 区分翻数レンジ
 *
 * 表示テキストの組み立ては呼び出し側の責務。早見表は "6-7"、
 * 学習ページは "6 〜 7" と体裁が異なり、満貫は「4 翻でも符次第で満貫に
 * なる」ことを教えるため下限を 4 として表示する（詳細は各表示側を参照）。
 */
export function hanRangeOf(key: string): HanRange | undefined {
  const index = DISPLAY_TIERS.findIndex((tier) => tier.key === key);
  if (index === -1) return undefined;

  const next = DISPLAY_TIERS[index + 1];
  return {
    min: DISPLAY_TIERS[index].minHan,
    max: next === undefined ? undefined : next.minHan - 1,
  };
}

/**
 * 満貫以上かどうかを判定する
 * 満貫以上判定
 */
export function isMangan(scoreLevel: string): boolean {
  return MANGAN_PLUS_TIERS.some((tier) => tier.level === scoreLevel);
}

/**
 * 点数レベルを日本語に変換する
 * 点数レベル日本語変換
 */
export function getScoreLevelName(scoreLevel: string): string {
  return (
    MANGAN_PLUS_TIERS.find((tier) => tier.level === scoreLevel)?.nameJa ?? ""
  );
}

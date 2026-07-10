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
  /** 固定の基本符 */
  readonly basePoints: number;
  /** 日本語名 */
  readonly nameJa: string;
}

/**
 * 満貫以上の点数区分テーブル（翻数しきい値の降順）
 * 点数区分テーブル
 *
 * 翻数→点数区分のしきい値（5/6/8/11/13/26翻）の唯一の定義。
 * 点数再計算・点数表出題・翻数簡略化はすべてこのテーブルから導出する。
 */
export const MANGAN_PLUS_TIERS: readonly HanTier[] = [
  {
    level: ScoreLevel.DoubleYakuman,
    key: "doubleYakuman",
    minHan: 26,
    basePoints: 16000,
    nameJa: "ダブル役満",
  },
  {
    level: ScoreLevel.Yakuman,
    key: "yakuman",
    minHan: 13,
    basePoints: 8000,
    nameJa: "役満",
  },
  {
    level: ScoreLevel.Sanbaiman,
    key: "sanbaiman",
    minHan: 11,
    basePoints: 6000,
    nameJa: "三倍満",
  },
  {
    level: ScoreLevel.Baiman,
    key: "baiman",
    minHan: 8,
    basePoints: 4000,
    nameJa: "倍満",
  },
  {
    level: ScoreLevel.Haneman,
    key: "haneman",
    minHan: 6,
    basePoints: 3000,
    nameJa: "跳満",
  },
  {
    level: ScoreLevel.Mangan,
    key: "mangan",
    minHan: 5,
    basePoints: 2000,
    nameJa: "満貫",
  },
];

/**
 * 翻数から満貫以上の点数区分を引く（満貫未満は undefined）
 * 点数区分特定
 */
export function scoreTierForHan(han: number): HanTier | undefined {
  return MANGAN_PLUS_TIERS.find((tier) => han >= tier.minHan);
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

import { MANGAN_MIN_HAN, MANGAN_PLUS_TIERS } from "@mahjong-scoring/core";
import type { HanTier } from "@mahjong-scoring/core";

/**
 * この練習が扱う満貫以上の点数区分（翻数しきい値の降順）
 * 練習用点数区分
 *
 * core の `MANGAN_PLUS_TIERS` からダブル役満を除いたもの。
 * 26 翻以上も「役満」として扱うため、回答選択肢にも表示にも出さない
 * （`score-table/generator.ts` が `Math.min(han, YAKUMAN_HAN)` で行っているのと同じ扱い）。
 */
export const PRACTICE_HAN_TIERS: readonly HanTier[] = MANGAN_PLUS_TIERS.filter(
  (tier) => tier.key !== "doubleYakuman",
);

// 満貫のしきい値は core の MANGAN_PLUS_TIERS が唯一の定義。
// この練習の翻数まわりを 1 モジュールから引けるよう再エクスポートする。
export { MANGAN_MIN_HAN };

/**
 * 翻数から満貫以上の点数区分を引く（満貫未満は undefined）
 * 練習用点数区分特定
 */
export function practiceHanTier(han: number): HanTier | undefined {
  return PRACTICE_HAN_TIERS.find((tier) => han >= tier.minHan);
}

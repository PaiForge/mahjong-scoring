import { MANGAN_MIN_HAN, MANGAN_PLUS_TIERS } from "@mahjong-scoring/core";
import type { HanTier } from "@mahjong-scoring/core";

/**
 * この練習が扱う満貫以上の点数区分（翻数しきい値の降順）
 * 練習用点数区分
 *
 * 既定（ダブル役満を採用しないルール）では core の `MANGAN_PLUS_TIERS` から
 * ダブル役満を除く。26 翻以上も「役満」として扱い、回答選択肢にも表示にも
 * 出さない（`score-table/generator.ts` が `Math.min(han, YAKUMAN_HAN)` で
 * 行っているのと同じ扱い）。ダブル役満を採用したルール設定
 * （`allowsDoubleYakuman`）では別の答えとして選択肢・表示に出す。
 */
export function practiceHanTiers(
  allowDoubleYakuman: boolean,
): readonly HanTier[] {
  return allowDoubleYakuman
    ? MANGAN_PLUS_TIERS
    : MANGAN_PLUS_TIERS.filter((tier) => tier.key !== "doubleYakuman");
}

// 満貫のしきい値は core の MANGAN_PLUS_TIERS が唯一の定義。
// この練習の翻数まわりを 1 モジュールから引けるよう再エクスポートする。
export { MANGAN_MIN_HAN };

/**
 * 翻数から満貫以上の点数区分を引く（満貫未満は undefined）
 * 練習用点数区分特定
 */
export function practiceHanTier(
  han: number,
  allowDoubleYakuman: boolean = false,
): HanTier | undefined {
  return practiceHanTiers(allowDoubleYakuman).find(
    (tier) => han >= tier.minHan,
  );
}

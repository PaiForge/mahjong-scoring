import { FU_VALUES, YAKUMAN_HAN } from "@mahjong-scoring/core";
import { MANGAN_MIN_HAN, practiceHanTiers } from "./han-tiers";

/**
 * 回答フォームの選択肢 1 つ
 * 回答選択肢
 */
export interface AnswerOption {
  readonly value: number;
  readonly label: string;
}

/** `score` 名前空間の翻訳関数（`form.options.*` を引く） */
type Translator = (key: string) => string;

/**
 * 点数計算の無限訓練の翻数の選択肢
 * 翻数選択肢
 *
 * 満貫以上を区分名で出す設定（`simplifyMangan`）では 1〜4翻のあとに区分名
 * （満貫・跳満…）を並べる。出さない設定では役満未満を数値で出し、役満以上
 * （ダブル役満の採用時はダブル役満も）だけを区分名で出す。区分の値は
 * その区分のしきい値の翻数。
 *
 * @param t - `score` 名前空間の翻訳関数
 */
export function practiceHanOptions(
  t: Translator,
  simplifyMangan: boolean,
  allowDoubleYakuman: boolean,
): readonly AnswerOption[] {
  // 満貫以上の区分は翻数しきい値の昇順で並べる（practiceHanTiers は降順）
  const manganPlusOptions = [...practiceHanTiers(allowDoubleYakuman)]
    .reverse()
    .map((tier) => ({
      value: tier.minHan,
      label: t(`form.options.${tier.key}`),
    }));
  const numbered = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}${t("form.options.hanSuffix")}`,
    }));

  if (simplifyMangan) {
    return [...numbered(MANGAN_MIN_HAN - 1), ...manganPlusOptions];
  }
  return [
    ...numbered(YAKUMAN_HAN - 1),
    ...manganPlusOptions.filter((option) => option.value >= YAKUMAN_HAN),
  ];
}

/**
 * 点数計算の無限訓練の符の選択肢
 * 符選択肢
 *
 * @param t - `score` 名前空間の翻訳関数
 */
export function practiceFuOptions(t: Translator): readonly AnswerOption[] {
  return FU_VALUES.map((value) => ({
    value,
    label: `${value}${t("form.options.fuSuffix")}`,
  }));
}

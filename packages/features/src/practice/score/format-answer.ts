import type { UserAnswer } from "@mahjong-scoring/core";
import { practiceHanTier } from "./han-tiers";

/**
 * 翻数の表示に使う翻訳と表示モード
 * 翻数表示オプション
 */
export interface FormatHanOptions {
  /** `score` 名前空間の翻訳関数（`form.options.*` / `result.pointSuffix` を引く） */
  readonly t: (key: string) => string;
  /** 満貫以上を区分名（満貫・跳満…）で出すか */
  readonly simplifyMangan: boolean;
  readonly allowDoubleYakuman: boolean;
}

/**
 * 翻数の表示（区分名か「n翻」）
 * 翻数表示
 *
 * 点数計算の無限訓練の答え合わせ（点数・待ち別点数）が使う。
 */
export function formatHan(
  han: number,
  { t, simplifyMangan, allowDoubleYakuman }: FormatHanOptions,
): string {
  const tier = simplifyMangan
    ? practiceHanTier(han, allowDoubleYakuman)
    : undefined;
  return tier
    ? t(`form.options.${tier.key}`)
    : `${han}${t("form.options.hanSuffix")}`;
}

/**
 * 支払いの表示（ロン「n点」・親ツモ「nオール」・子ツモ「a/b」）
 * 支払い表示
 *
 * ツモは支払いの内訳や「オール」が単位を兼ねるため「点」を付けない
 * （`formatScoreAnswer` と同じ表記）。回答（`UserAnswer`）は親子を持たない
 * ため、親ツモかどうかは呼び出し側が `isOyaTsumo` で指定する。
 */
export function formatPayment(
  answer: UserAnswer,
  isOyaTsumo: boolean,
  { t }: Pick<FormatHanOptions, "t">,
): string {
  if (answer.scoreFromKo !== undefined) {
    return `${answer.scoreFromKo}/${answer.scoreFromOya}`;
  }
  if (isOyaTsumo) return `${answer.score}${t("form.options.all")}`;
  return `${answer.score}${t("result.pointSuffix")}`;
}

import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "../practice-menu-types";
import { practiceTitleKey } from "./catalog";

/**
 * 練習へのリンクに添えるバリアント名（出題設定の名前）
 *
 * バリアントを指定し、かつその練習が設定を持つときだけ
 * `<namespace>.variants.<key>.label` を引く。設定を持たない練習の
 * `DEFAULT_VARIANT` は辞書に無いので、名前を添えない。
 *
 * @param tAll - 辞書全体を引ける翻訳関数（`getTranslations()` / `useTranslations()`）
 * @param slug - 練習のスラッグ
 * @param variant - 送り先のバリアント
 */
export function practiceVariantLabel(
  tAll: (key: string) => string,
  slug: PracticeMenuSlug,
  variant: string | undefined,
): string | undefined {
  if (variant === undefined) return undefined;
  const menu = practiceMenuBySlug(slug);
  return menu.hasSetup
    ? tAll(`${menu.namespace}.variants.${variant}.label`)
    : undefined;
}

/**
 * 練習へのリンクの表題（練習名に、送り先のバリアント名を括弧で添える）
 * 練習リンク表題
 *
 * 例: 「点数早見表（子の満貫以上）」。バリアント名を添えない練習は練習名だけ。
 *
 * @param tAll - 辞書全体を引ける翻訳関数（`getTranslations()` / `useTranslations()`）
 * @param slug - 練習のスラッグ
 * @param variant - 送り先のバリアント
 */
export function practiceDisplayTitle(
  tAll: (key: string) => string,
  slug: PracticeMenuSlug,
  variant: string | undefined,
): string {
  const title = tAll(`practice.${practiceTitleKey(slug)}`);
  const variantLabel = practiceVariantLabel(tAll, slug, variant);
  return variantLabel ? `${title}（${variantLabel}）` : title;
}

"use client";

import { useTranslations } from "next-intl";

/**
 * ブランドロゴ
 *
 * @description
 * サイズバリアント別のロゴタイプ（文字＋初心者マーク）。
 *
 * @remarks
 * 以前はシンボルマークを併置していたが、24〜32px では太枠のナビゲーションに
 * 対して図版が細部を保てず、置くほど画面が散らかったため文字だけにしていた。
 * 現在は図版の代わりに初心者マークの絵文字を添えている（装飾のため読み上げ対象外）。
 */

interface BrandLogoProps {
  /** ロゴの表示サイズ */
  readonly size: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
} as const;

export function BrandLogo({ size }: BrandLogoProps) {
  const t = useTranslations("nav");

  return (
    // brandMahjong + brandScoring を連結するとサイト名（metadata.siteName）と一致する。
    // ロゴの二色配色のために分割しているだけなので、サイト名変更時は両者を揃えること。
    <span className={`${SIZE_CLASS[size]} font-bold whitespace-nowrap`}>
      <span className="text-primary-700">{t("brandMahjong")}</span>
      <span className="text-surface-500">{t("brandScoring")}</span>
      <span aria-hidden="true" className="ml-1">
        🔰
      </span>
    </span>
  );
}

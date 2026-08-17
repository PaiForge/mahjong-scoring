"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * ブランドロゴ
 * サイズバリアント別のロゴ＋テキスト表示
 */

interface BrandLogoProps {
  /** ロゴの表示サイズ */
  readonly size: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { imageClass: "h-6 w-auto", textClass: "text-sm" },
  md: { imageClass: "h-8 w-auto", textClass: "text-lg" },
  lg: { imageClass: "h-8 w-auto", textClass: "text-xl" },
} as const;

/*
 * ロゴ PNG は緑の線画のみで背景が透過。初心者マーク（若葉マーク）モチーフの
 * 二色配色にするため、画像自体は編集せず表示側で薄い黄色を敷く。
 * 角丸 16% は画像内の緑枠の角丸（枠幅比 13.3%）に余白分を足した値で、
 * 黄色のタイルが緑枠と平行なカーブになる。
 */
const MARK_CLASS = "rounded-[16%] bg-brand-mark";

export function BrandLogo({ size }: BrandLogoProps) {
  const t = useTranslations("nav");
  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt=""
        width={512}
        height={512}
        className={`${config.imageClass} ${MARK_CLASS}`}
        priority
      />
      {/* brandMahjong + brandScoring を連結するとサイト名（metadata.siteName）と一致する。
          ロゴの二色配色のために分割しているだけなので、サイト名変更時は両者を揃えること。 */}
      <span className={`${config.textClass} font-bold`}>
        <span className="text-primary-700">{t("brandMahjong")}</span>
        <span className="text-surface-500">{t("brandScoring")}</span>
      </span>
    </div>
  );
}

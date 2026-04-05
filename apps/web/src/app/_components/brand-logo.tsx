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

export function BrandLogo({ size }: BrandLogoProps) {
  const t = useTranslations("nav");
  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt=""
        width={572}
        height={441}
        className={config.imageClass}
      />
      <span className={`${config.textClass} font-bold`}>
        <span className="text-primary-700">{t("brandMahjong")}</span>
        <span className="text-surface-500">{t("brandScoring")}</span>
      </span>
    </div>
  );
}

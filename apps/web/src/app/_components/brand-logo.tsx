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
  sm: { imageSize: 28, imageClass: "size-7", textClass: "text-sm" },
  md: { imageSize: 48, imageClass: "size-12", textClass: "text-base" },
  lg: { imageSize: 56, imageClass: "size-14", textClass: "text-lg" },
} as const;

export function BrandLogo({ size }: BrandLogoProps) {
  const t = useTranslations("nav");
  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt=""
        width={config.imageSize}
        height={config.imageSize}
        className={config.imageClass}
      />
      <span className={`${config.textClass} font-bold`}>
        <span className="text-primary-700">{t("brandMahjong")}</span>
        <span className="text-surface-500">{t("brandScoring")}</span>
      </span>
    </div>
  );
}

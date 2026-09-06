"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * ブランドロゴ
 *
 * @description
 * サイズバリアント別のロゴタイプ（文字＋シンボルマーク）。
 *
 * @remarks
 * シンボルマークはサイト共通の `public/logo.png`（初心者マークを載せた麻雀牌）。
 * ファビコン・アプリアイコン・OGP も同じ 1 枚から生成しているので、ロゴを
 * 差し替えるときはここではなく `public/logo.png` を置き換えて
 * `pnpm icons:generate` と `pnpm og:generate` を回す。
 *
 * 以前は一索の線画を併置していたが、24〜32px では線が潰れて太枠の
 * ナビゲーションに対して図版が形を保てず、置くほど画面が散らかったため、
 * いったん文字だけにして初心者マークの絵文字を添えていた。現在のマークが
 * 同じ寸法で成立するのは、細部を持たない塗りの図形（二色の若葉と牌の緑の
 * 小口）だけで輪郭が読めるため。線画に差し替えると同じ理由で潰れる。
 *
 * 装飾なので読み上げ対象外（`alt=""`）。文字側がサイト名を読み上げる。
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

/**
 * next/image に渡す基準の描画幅（px）。
 *
 * 実際の寸法は文字サイズに追従する `h-[1.6em]` で決まる（sm の 14px で約
 * 22px、lg の 20px で約 32px）。この値は最適化された画像を何 px 幅で
 * 生成するかを Next に伝えるためだけのもので、最大の lg に合わせてある。
 * 元画像は 512px あるが、配信されるのはここから導かれた小さい版だけ。
 *
 * 1.6em は文字の太さと図版の重さを揃えた値。牌が傾いているぶん、正方の
 * ボックスに対して実際に色が乗る面積が小さく、文字と同じ 1em 前後では
 * 添え物に見える。
 */
const MARK_BASE_PX = 32;

export function BrandLogo({ size }: BrandLogoProps) {
  const t = useTranslations("nav");

  return (
    // brandMahjong + brandScoring を連結するとサイト名（metadata.siteName）と一致する。
    // ロゴの二色配色のために分割しているだけなので、サイト名変更時は両者を揃えること。
    <span
      className={`${SIZE_CLASS[size]} inline-flex items-center font-bold whitespace-nowrap`}
    >
      <span className="text-primary-700">{t("brandMahjong")}</span>
      <span className="text-surface-500">{t("brandScoring")}</span>
      <Image
        src="/logo.png"
        alt=""
        width={MARK_BASE_PX}
        height={MARK_BASE_PX}
        // ヘッダーは初期表示に入るため遅延読み込みしない。フッターも同じ URL を
        // 指すので、2 か所に置いてもリクエストは 1 本で済む。
        loading="eager"
        className="ml-1 h-[1.6em] w-[1.6em]"
      />
    </span>
  );
}

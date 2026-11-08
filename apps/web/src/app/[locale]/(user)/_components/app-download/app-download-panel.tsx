import { useTranslations } from "next-intl";

import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { iosAppStoreUrl } from "@/config";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { AppStoreQrCode } from "./app-store-qr-code";

/**
 * Apple 公式の「App Store からダウンロード」バッジ（言語ごと・黒）
 *
 * Apple Marketing Tools が配る SVG をそのまま置いている（日本語は
 * `Download_on_the_App_Store_Badge_JP_RGB_blk_100317`、英語は
 * `Download_on_the_App_Store_Badge_US-UK_RGB_blk_4SVG_092917`）。Apple の規定で、色・文言・
 * 縦横比を変えず、画面上の高さは 40px 以上にする（`h-10` が下限）。バッジの文言は
 * ページの言語に合わせる（英語のページに日本語のバッジを出さない）。外部の配信 URL を
 * 直接読まないのは、フッターが全ページに出るため、ページを開くたびに Apple へ要求が
 * 飛ぶのを避けるため。幅・高さは各 SVG の `viewBox`（言語で横幅が違う）。
 */
const BADGES = {
  ja: { src: "/badges/app-store-download-ja.svg", width: 109, height: 40 },
  en: { src: "/badges/app-store-download-en.svg", width: 120, height: 40 },
} as const satisfies Record<
  SupportedLocale,
  { readonly src: string; readonly width: number; readonly height: number }
>;

/** 置き場所ごとの大きさ */
const SIZE_CLASSES = {
  sm: { badge: "h-10", qr: "size-20", gap: "gap-3" },
  lg: { badge: "h-12", qr: "size-28", gap: "gap-6" },
} as const;

interface AppDownloadPanelProps {
  /** ページの言語（バッジの文言と App Store の国を決める） */
  readonly locale: SupportedLocale;
  /** `sm` = フッター、`lg` = LP の節 */
  readonly size: keyof typeof SIZE_CLASSES;
  /** 横の揃え。LP は中央、フッターは左 */
  readonly align: "start" | "center";
}

/**
 * iOS アプリの入手導線（App Store のバッジ・QR コード・Android の案内）
 * アプリ入手パネル
 *
 * バッジは全幅で出し、QR コードは `md` 以上（デスクトップで見ている人が
 * スマホで読み取る）だけに出す。Android 版はストアに無いので、Google Play の
 * バッジは置かず「準備中」の 1 行だけを添える（Google の規定でバッジはストアの
 * ページへのリンクに限られる）。公開時期は書かない — 決まるまで同じ文言が
 * 残り続けるため。Android 版を出したら、この 1 行を Google Play のバッジに
 * 差し替える。
 *
 * iOS Safari ではルートレイアウトの Smart App Banner（`apple-itunes-app`）も
 * 上端に出る。こちらはそれが出ない端末（デスクトップ・他のブラウザ）向けの
 * 常設の導線。
 *
 * 言語は props で受ける（LP は静的生成のため headers を読まない。フッターは
 * `getLocaleLinks()` の言語を渡す）。
 */
export function AppDownloadPanel({
  locale,
  size,
  align,
}: AppDownloadPanelProps) {
  const t = useTranslations("appDownload");
  const classes = SIZE_CLASSES[size];
  const badge = BADGES[locale];
  const storeUrl = iosAppStoreUrl(locale);
  const alignClass = align === "center" ? "items-center" : "items-start";

  return (
    <div className={`flex flex-col ${classes.gap} ${alignClass}`}>
      <div className={`flex items-center ${classes.gap}`}>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 rounded-lg ${FOCUS_RING_CLASSES}`}
        >
          {/* SVG を next/image に通しても最適化されないので素の img で読む */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.src}
            alt={t("badgeAlt")}
            width={badge.width}
            height={badge.height}
            className={`${classes.badge} w-auto`}
          />
        </a>
        <AppStoreQrCode
          url={storeUrl}
          label={t("qrLabel")}
          className={`hidden md:block ${classes.qr} shrink-0 rounded-md border border-panel`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("androidComingSoon")}</p>
    </div>
  );
}

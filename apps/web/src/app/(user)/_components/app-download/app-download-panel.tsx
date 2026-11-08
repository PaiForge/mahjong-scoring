import { getTranslations } from "next-intl/server";

import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { IOS_APP_STORE_URL } from "@/config";

import { AppStoreQrCode } from "./app-store-qr-code";

/**
 * Apple 公式の「App Store からダウンロード」バッジ（日本語・黒）
 *
 * Apple Marketing Tools が配る `Download_on_the_App_Store_Badge_JP_RGB_blk_100317`
 * をそのまま置いている。Apple の規定で、色・文言・縦横比を変えず、画面上の
 * 高さは 40px 以上にする（`h-10` が下限）。外部の配信 URL を直接読まないのは、
 * フッターが全ページに出るため、ページを開くたびに Apple へ要求が飛ぶのを避けるため。
 */
const BADGE_SRC = "/badges/app-store-download-ja.svg";

/** バッジの SVG の縦横比（108.85 × 40） */
const BADGE_WIDTH = 109;
const BADGE_HEIGHT = 40;

/** 置き場所ごとの大きさ */
const SIZE_CLASSES = {
  sm: { badge: "h-10", qr: "size-20", gap: "gap-3" },
  lg: { badge: "h-12", qr: "size-28", gap: "gap-6" },
} as const;

interface AppDownloadPanelProps {
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
 */
export async function AppDownloadPanel({ size, align }: AppDownloadPanelProps) {
  const t = await getTranslations("appDownload");
  const classes = SIZE_CLASSES[size];
  const alignClass = align === "center" ? "items-center" : "items-start";

  return (
    <div className={`flex flex-col ${classes.gap} ${alignClass}`}>
      <div className={`flex items-center ${classes.gap}`}>
        <a
          href={IOS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 rounded-lg ${FOCUS_RING_CLASSES}`}
        >
          {/* SVG を next/image に通しても最適化されないので素の img で読む */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BADGE_SRC}
            alt={t("badgeAlt")}
            width={BADGE_WIDTH}
            height={BADGE_HEIGHT}
            className={`${classes.badge} w-auto`}
          />
        </a>
        <AppStoreQrCode
          url={IOS_APP_STORE_URL}
          label={t("qrLabel")}
          className={`hidden md:block ${classes.qr} shrink-0 rounded-md border border-panel`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("androidComingSoon")}</p>
    </div>
  );
}

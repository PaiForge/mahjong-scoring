import Image from "next/image";
import { getTranslations } from "next-intl/server";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import type { NativeAdView } from "@/lib/ads/creatives";

import { ChevronRightIcon } from "./icons/chevron-right-icon";
import { NATIVE_AD_LINK_PROPS, NativeAdBadge } from "./native-ad-badge";

interface NativeAdCardProps {
  readonly creative: NativeAdView;
}

/**
 * カード型のネイティブ広告（`native_card`）
 * 広告カード
 *
 * 練習一覧の練習カード（`PracticeCard`）と同じ骨格 — 太枠の白いカード、
 * 左上にタイトル、右上に添え物、右下に行き先の文言 — で描く。練習一覧の
 * グリッドに混ざったときに 1 枚だけ別の形にならないようにするため。
 * 練習一覧以外（結果画面・教本の章末）でも同じ形を使う。
 *
 * 練習カードと違い、カード全体を 1 つのリンクにする。練習カードは教本
 * アイコン・段級位ピルという別の行き先を内側に持つが、広告の行き先は 1 つ
 * だけで、どこを押しても同じ所へ行く方が迷わない。影を持たないのは練習
 * カードに揃えるため（持ち上がる hover は同じ）。
 *
 * 画像（書影など）があれば画像を、無ければ絵文字を左に置く。
 */
export async function NativeAdCard({ creative }: NativeAdCardProps) {
  const t = await getTranslations("nativeAd");

  return (
    <a
      href={creative.href}
      {...NATIVE_AD_LINK_PROPS}
      data-native-ad={creative.id}
      className={`group flex flex-col justify-between rounded-2xl border-3 border-ink bg-white p-5 transition-transform hover:-translate-y-1 ${FOCUS_RING_CLASSES}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-surface-900">
            {creative.title}
          </h3>
          <NativeAdBadge label={t("badge")} ariaLabel={t("badgeLabel")} />
        </div>
        <div className="mt-3 flex items-start gap-4">
          {creative.imageUrl !== undefined ? (
            <Image
              src={creative.imageUrl}
              alt={creative.imageAlt}
              width={80}
              height={80}
              className="size-20 shrink-0 object-contain"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface-50 text-4xl"
            >
              {creative.icon}
            </span>
          )}
          {creative.description !== undefined && (
            <p className="text-sm leading-relaxed text-surface-600">
              {creative.description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span
          className={`flex items-center text-sm font-bold ${ROW_LINK_TITLE_CLASSES}`}
        >
          {t("cta")}
          <ChevronRightIcon className="ml-1 size-4" />
          <span className="sr-only">{t("opensInNewTab")}</span>
        </span>
      </div>
    </a>
  );
}

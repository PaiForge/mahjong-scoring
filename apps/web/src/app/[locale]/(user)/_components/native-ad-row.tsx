import Image from "next/image";
import { getTranslations } from "next-intl/server";

import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import { ROW_ITEM_CLASSES, ROW_INNER_CLASSES } from "./link-row";
import { NATIVE_AD_LINK_PROPS, NativeAdBadge } from "./native-ad-badge";

interface NativeAdRowProps {
  readonly creative: NativeAdView;
}

/**
 * 行リンク型のネイティブ広告（`native_row`）
 * 広告行
 *
 * `LinkRow` と同じ行 — 淡い実線の区切り・行頭の絵文字・下線付きのタイトル・
 * 淡い説明 — で描き、`LinkRowList` の中にそのまま 1 行として入る（`<li>`）。
 * 枠と余白は `LinkRow` と共有しているため、片方だけ行の高さがずれることはない。
 *
 * 行末には「PR」の表記を置く。`LinkRow` の行末は順位やバッジの位置で、
 * 広告の行ではそこが「広告である」ことを示す場所になる。
 *
 * 外部サイトへ新しいタブで開くため `next/link` ではなく `<a>` を使う。
 */
export async function NativeAdRow({ creative }: NativeAdRowProps) {
  const t = await getTranslations("nativeAd");

  return (
    <li className={ROW_ITEM_CLASSES}>
      <a
        href={creative.href}
        {...NATIVE_AD_LINK_PROPS}
        data-native-ad={creative.id}
        className={`group items-start transition-colors hover:bg-surface-50 ${ROW_INNER_CLASSES} ${FOCUS_RING_CLASSES}`}
      >
        {/* 行頭・行末はタイトル 1 行目の行ボックスに中央揃え（LinkRow と同じ） */}
        <span className="flex min-h-5 shrink-0 items-center">
          {creative.imageUrl !== undefined ? (
            <Image
              src={creative.imageUrl}
              alt={creative.imageAlt}
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          ) : (
            <span className="text-base" aria-hidden="true">
              {creative.icon}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-bold ${ROW_LINK_TITLE_CLASSES}`}>
            {creative.title}
            <span className="sr-only">{t("opensInNewTab")}</span>
          </span>
          {creative.description !== undefined && (
            <span className="mt-0.5 block text-xs text-surface-400">
              {creative.description}
            </span>
          )}
        </span>
        <span className="flex min-h-5 shrink-0 items-center">
          <NativeAdBadge label={t("badge")} ariaLabel={t("badgeLabel")} />
        </span>
      </a>
    </li>
  );
}

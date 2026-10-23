import { parseHais, type HaiKindId } from "@mahjong-scoring/core";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import type { SupportedLocale } from "@/i18n/locales";

import { resolveAdHref } from "./amazon";
import { resolveCreativeCopy, type CreativeCopy } from "./copy";
import { isAdKind, kindForSlot, type AdSlot } from "./registry";

/** キャッシュに載せる形。文言は全ロケール分を持ち、読む側で解決する */
export interface ActiveCreative {
  readonly id: string;
  readonly kind: string;
  readonly href: string | null;
  readonly asin: string | null;
  readonly icon: string | null;
  readonly imagePath: string | null;
  readonly imageAlt: string | null;
  readonly hand: string | null;
  readonly copy: CreativeCopy;
}

/** 手牌の表記を牌の並びにする。無い・読めない表記は undefined */
function toHandTiles(hand: string | null): HaiKindId[] | undefined {
  const tiles = parseHais(hand ?? undefined);
  return tiles.length > 0 ? tiles : undefined;
}

/**
 * 掲載中の広告を画面に渡す形にする（並び順は保つ）
 * 広告表示変換
 *
 * スロットは 1 つの kind しか受け付けない（`AD_SLOTS`）ため、kind の一致を
 * 見るのは行の絞り込みではなく、手で書かれた不整合な行を描画に通さないため。
 * タイトルの無い行も通さない。
 *
 * ASIN で指す広告は、スロットを読む側（web / モバイル）のトラッキング ID と
 * リンクを組み立て、その ID が未設定（undefined）の間は出さない（`resolveAdHref`）。
 * もう片方の ID には落とさない（`adNetworkSettings` の TSDoc 参照）。
 * 管理画面の一覧がその旨を示す。
 */
export function toNativeAdViews(
  creatives: readonly ActiveCreative[],
  slot: AdSlot,
  locale: SupportedLocale,
  trackingId: string | undefined,
): NativeAdView[] {
  const kind = kindForSlot(slot);
  return creatives.flatMap((creative) => {
    if (!isAdKind(creative.kind) || creative.kind !== kind) return [];
    const { title, description } = resolveCreativeCopy(creative.copy, locale);
    if (title === "") return [];
    const href = resolveAdHref(creative, trackingId);
    if (href === undefined) return [];
    return [
      {
        id: creative.id,
        kind,
        href,
        icon: creative.icon ?? undefined,
        imageUrl: creative.imagePath ?? undefined,
        imageAlt: creative.imageAlt ?? "",
        hand: toHandTiles(creative.hand),
        title,
        description,
      },
    ];
  });
}

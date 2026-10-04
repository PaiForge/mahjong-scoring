import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { parseHais, type HaiKindId } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { AD_CREATIVES_CACHE_TAG } from "@/lib/cache-tags";
import { adCreatives, adNetworkSettings, db } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

import { AMAZON_NETWORK, resolveAdHref } from "./amazon";
import { resolveCreativeCopy, type CreativeCopy } from "./copy";
import { loadCreativeCopy } from "./load-copy";
import {
  isAdKind,
  kindForSlot,
  placementsForSlot,
  type AdKind,
  type AdSlot,
} from "./registry";

/**
 * 画面に渡す広告 1 件。文言は閲覧者のロケールで解決済みで、そのまま
 * クライアントコンポーネントへ渡せる（シリアライズ可能）。
 * 広告ビュー
 */
export interface NativeAdView {
  readonly id: string;
  readonly kind: AdKind;
  readonly href: string;
  /** 絵文字。画像が無いときの見た目 */
  readonly icon: string | undefined;
  /** 画像の公開 URL */
  readonly imageUrl: string | undefined;
  /** 画像の代替テキスト。画像が無ければ空 */
  readonly imageAlt: string;
  /**
   * カードの帯に並べる手牌。持たなければ undefined。読めない表記も
   * undefined にする（管理画面で検証済みのため、手で書かれた行だけ）
   */
  readonly hand: readonly HaiKindId[] | undefined;
  readonly title: string;
  readonly description: string | undefined;
}

/** キャッシュに載せる形。文言は全ロケール分を持ち、読む側で解決する */
interface ActiveCreative {
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

const EMPTY_COPY: CreativeCopy = { title: {}, description: {} };

async function queryActiveCreatives(slot: string): Promise<ActiveCreative[]> {
  const rows = await db
    .select()
    .from(adCreatives)
    .where(and(eq(adCreatives.slot, slot), eq(adCreatives.isActive, true)))
    .orderBy(asc(adCreatives.sortOrder), asc(adCreatives.createdAt));
  if (rows.length === 0) return [];

  const copyById = await loadCreativeCopy(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    href: row.href,
    asin: row.asin,
    icon: row.icon,
    imagePath: row.imagePath,
    imageAlt: row.imageAlt,
    hand: row.hand,
    copy: copyById.get(row.id) ?? EMPTY_COPY,
  }));
}

/**
 * スロットの掲載中の広告（並び順どおり）
 *
 * スロット単位で `unstable_cache` に載せる。広告を出す静的ページ（練習一覧・
 * 教本の章・用語集）を静的なまま保つため — 閲覧者に依存しない読み込みなので
 * cookie を読まず、ページを動的にしない。
 *
 * 鮮度はタグが持つ。管理画面の書き込みはすべて `revalidateAdCreatives()` で
 * タグを捨てるため、変更は次のリクエストで反映される。`revalidate` は
 * その取りこぼしの保険でしかないが、ルートの ISR 間隔はそのページが読む
 * キャッシュの最小値になるため、短くすると広告を出す静的ページがすべて
 * 同じ間隔で作り直される。1 日にしている。
 *
 * DB の失敗はキャッシュの外で握る。中で握って空配列を返すと、その空配列が
 * 1 日キャッシュされ、DB が戻っても広告が出ない。
 */
const getActiveCreativesCached = unstable_cache(
  queryActiveCreatives,
  ["active-ad-creatives"],
  { tags: [AD_CREATIVES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

async function queryAmazonTrackingId(): Promise<string | null> {
  const [row] = await db
    .select({ trackingId: adNetworkSettings.trackingId })
    .from(adNetworkSettings)
    .where(eq(adNetworkSettings.network, AMAZON_NETWORK))
    .limit(1);
  return row?.trackingId ?? null;
}

/**
 * Amazon のトラッキング ID（未設定なら null）。広告と同じタグ・同じ鮮度で
 * キャッシュする — 管理画面で設定した時点でタグが捨てられ、ASIN の広告が
 * 次のリクエストから出る。
 */
const getAmazonTrackingIdCached = unstable_cache(
  queryAmazonTrackingId,
  ["amazon-tracking-id"],
  { tags: [AD_CREATIVES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

/** 手牌の表記を牌の並びにする。無い・読めない表記は undefined */
function toHandTiles(hand: string | null): HaiKindId[] | undefined {
  const tiles = parseHais(hand ?? undefined);
  return tiles.length > 0 ? tiles : undefined;
}

/**
 * スロットの掲載中の広告を画面に渡す形で返す
 * 広告取得
 *
 * スロットは 1 つの kind しか受け付けない（`AD_SLOTS`）ため、kind の一致を
 * 見るのは行の絞り込みではなく、手で書かれた不整合な行を描画に通さないため。
 * 読み込みに失敗したら空配列（広告を出さない）— 広告の失敗でページを
 * 落とさない。
 *
 * ASIN で指す広告は、トラッキング ID が未設定の間は出さない
 * （`resolveAdHref`）。管理画面の一覧がその旨を示す。
 */
export async function getNativeAdCreatives(
  slot: AdSlot,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<NativeAdView[]> {
  let creatives: ActiveCreative[];
  let trackingId: string | null;
  try {
    [creatives, trackingId] = await Promise.all([
      getActiveCreativesCached(slot),
      getAmazonTrackingIdCached(),
    ]);
  } catch (error) {
    logExternalError("getNativeAdCreatives", `slot=${slot}`, error);
    return [];
  }

  const kind = kindForSlot(slot);
  return creatives.flatMap((creative) => {
    if (!isAdKind(creative.kind) || creative.kind !== kind) return [];
    const { title, description } = resolveCreativeCopy(creative.copy, locale);
    if (title === "") return [];
    const href = resolveAdHref(creative, trackingId ?? undefined);
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

/**
 * スロットの画面に出す広告（並び順の先頭から、スロットの枠数まで）
 * 掲載広告取得
 *
 * 枠を複数持つ画面（教本の目次）が使う。掲載中が枠数より少なければ、
 * 返す数も少ない — 同じ広告を繰り返して埋めない。
 */
export async function getNativeAdPlacements(
  slot: AdSlot,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<NativeAdView[]> {
  const creatives = await getNativeAdCreatives(slot, locale);
  return creatives.slice(0, placementsForSlot(slot));
}

/**
 * スロットに 1 枠だけ出す画面が使う広告（先頭の 1 件）。無ければ undefined
 * 単独広告取得
 *
 * どの画面も 1 枠しか持たないため、並び順の先頭が掲載される。複数の広告を
 * 登録しておくのは、先頭を無効にしたときに次が繰り上がるようにするため。
 */
export async function getNativeAdCreative(
  slot: AdSlot,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<NativeAdView | undefined> {
  const [first] = await getNativeAdCreatives(slot, locale);
  return first;
}

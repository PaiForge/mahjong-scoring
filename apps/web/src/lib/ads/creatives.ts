import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { AD_CREATIVES_CACHE_TAG } from "@/lib/cache-tags";
import { adCreatives, adNetworkSettings, db } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

import { AMAZON_NETWORK } from "./amazon";
import type { CreativeCopy } from "./copy";
import { loadCreativeCopy } from "./load-copy";
import { toNativeAdViews, type ActiveCreative } from "./native-ad-views";
import {
  placementsForSlot,
  platformForSlot,
  type AdPlatform,
  type AdSlot,
} from "./registry";

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
 *
 * dev サーバーではこのキャッシュはプロセスのメモリにあり、`.next` の
 * ファイルを消しても DB の行を直しても捨てられない。シードを流す前に一度でも
 * ページを描いていると「広告なし」が残り続けるので、管理画面（`/admin/ads`）で
 * トラッキング ID を別の値にして保存し元に戻す（タグが捨てられる。同じ値の
 * 保存は DB が更新されず効かない）か、dev サーバーを再起動する。
 */
const getActiveCreativesCached = unstable_cache(
  queryActiveCreatives,
  ["active-ad-creatives"],
  { tags: [AD_CREATIVES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

async function queryAmazonTrackingId(
  platform: AdPlatform,
): Promise<string | null> {
  const [row] = await db
    .select({ trackingId: adNetworkSettings.trackingId })
    .from(adNetworkSettings)
    .where(
      and(
        eq(adNetworkSettings.network, AMAZON_NETWORK),
        eq(adNetworkSettings.platform, platform),
      ),
    )
    .limit(1);
  return row?.trackingId ?? null;
}

/**
 * プラットフォームの Amazon のトラッキング ID（未設定なら null）。広告と
 * 同じタグ・同じ鮮度でキャッシュする — 管理画面で設定した時点でタグが
 * 捨てられ、ASIN の広告が次のリクエストから出る。
 */
const getAmazonTrackingIdCached = unstable_cache(
  queryAmazonTrackingId,
  ["amazon-tracking-id"],
  { tags: [AD_CREATIVES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

/**
 * スロットの掲載中の広告を画面に渡す形で返す
 * 広告取得
 *
 * 読み込みに失敗したら空配列（広告を出さない）— 広告の失敗でページを
 * 落とさない。どの行を出すか・どう組み立てるかは {@link toNativeAdViews}。
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
      getAmazonTrackingIdCached(platformForSlot(slot)),
    ]);
  } catch (error) {
    logExternalError("getNativeAdCreatives", `slot=${slot}`, error);
    return [];
  }

  return toNativeAdViews(creatives, slot, locale, trackingId ?? undefined);
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

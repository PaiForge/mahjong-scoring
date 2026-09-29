import { parseTehai } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";
import { extractAsin } from "@/lib/ads/amazon";
import type { StoredCopy } from "@/lib/ads/copy";
import { isAdSlot, kindForSlot } from "@/lib/ads/registry";

/** 管理フォームから受け取る広告の入力値 */
export interface AdCreativeInput {
  readonly slot: string;
  /**
   * Amazon の商品の ASIN（商品ページの URL を貼ってもよい）。空文字は
   * 「ASIN で指さない」で、そのときは `href` を使う
   */
  readonly asin: string;
  /** 遷移先の URL。ASIN を指定したときは使わない */
  readonly href: string;
  readonly isActive: boolean;
  /** 絵文字。空文字は「無し」 */
  readonly icon: string;
  /** 画像の公開 URL（/api/admin/ads/image の戻り値）。空文字は「無し」 */
  readonly imageUrl: string;
  readonly imageAlt: string;
  /** カードの帯に並べる手牌（MSPZ 表記）。空文字は「無し」 */
  readonly hand: string;
  /** ロケール → タイトル。空文字は「そのロケールでは書かない」 */
  readonly title: Readonly<Record<string, string>>;
  /** ロケール → 説明。空文字は「そのロケールでは書かない」 */
  readonly description: Readonly<Record<string, string>>;
}

/** 広告入力のバリデーションエラー（admin.ads の i18n キー） */
export type AdCreativeValidationError =
  | "errorSlotInvalid"
  | "errorHrefInvalid"
  | "errorAsinInvalid"
  | "errorVisualRequired"
  | "errorIconTooLong"
  | "errorImageInvalid"
  | "errorImageAltRequired"
  | "errorHandInvalid"
  | "errorHandNotForRow"
  | "errorTitleRequired"
  | "errorCopyTooLong";

/**
 * 各フィールドの最大長。入力欄の `maxLength` もここから引く
 * （DB の varchar と一致させる）。
 */
export const AD_CREATIVE_LIMITS = {
  href: 2048,
  icon: 16,
  imageAlt: 255,
  hand: 64,
  title: 255,
  description: 1000,
} as const;

/** 検証を通った入力。空文字を undefined に、文言をロケールごとの形にしたもの */
export interface ValidAdCreative {
  readonly slot: string;
  /** ASIN と URL はどちらか一方だけが入る（DB の `ad_creatives_chk_one_link`） */
  readonly asin: string | undefined;
  readonly href: string | undefined;
  readonly isActive: boolean;
  readonly icon: string | undefined;
  readonly imageUrl: string | undefined;
  readonly imageAlt: string | undefined;
  readonly hand: string | undefined;
  readonly copy: {
    readonly title: StoredCopy;
    readonly description: StoredCopy;
  };
}

/**
 * 遷移先が保存できる URL か（https・長さ上限）。前後の空白は呼び出し側で除く。
 * 1 件の保存（{@link validateAdCreative}）とタイトル単位の一括更新が共有する
 */
export function isValidAdHref(href: string): boolean {
  return href.length <= AD_CREATIVE_LIMITS.href && isHttpsUrl(href);
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 画像 URL が ad-creatives バケットの WebP か。
 *
 * 画像は `next/image` で描画し、`next.config.ts` の remotePatterns は
 * このバケットの `<uuid>.webp` しか通さない。別の URL を保存できると、
 * 保存は通って公開ページの描画で落ちる。
 */
function isAdImageUrl(value: string, imageUrlPrefix: string): boolean {
  if (!value.startsWith(imageUrlPrefix)) return false;
  return /^[0-9a-f-]+\.webp$/.test(value.slice(imageUrlPrefix.length));
}

/** 帯に並べられる手牌の枚数の上限（ツモ後の 14 枚） */
const MAX_HAND_TILES = 14;

/**
 * 手牌の表記が帯に並べられるものか。
 *
 * 帯は純手牌を 1 列に並べるだけなので、副露（`[...]`）は受け付けない —
 * 表記が通っても描画で落ちる部分を保存させない。
 */
function isValidHand(value: string): boolean {
  if (value.length > AD_CREATIVE_LIMITS.hand) return false;
  const tehai = parseTehai(value);
  return (
    tehai !== undefined &&
    tehai.exposed.length === 0 &&
    tehai.closed.length > 0 &&
    tehai.closed.length <= MAX_HAND_TILES
  );
}

function toStoredCopy(
  values: Readonly<Record<string, string>>,
  maxLength: number,
): StoredCopy | "tooLong" {
  const stored: StoredCopy = {};
  for (const locale of SUPPORTED_LOCALES) {
    const value = (values[locale] ?? "").trim();
    if (value.length > maxLength) return "tooLong";
    if (value.length > 0) stored[locale] = value;
  }
  return stored;
}

/**
 * 広告入力のバリデーション
 * 広告入力検証
 *
 * DB の CHECK（絵文字・画像・手牌のどれかを持つ・代替テキストは画像と対・
 * 既定ロケールのタイトル必須）を保存前に i18n キーのエラーとして返す。
 * 画像には代替テキストを必須にする（DB は画像なしの代替テキストを禁じる
 * だけで、逆は許す）。書影を読めない人に広告の中身が伝わらなくなるため。
 *
 * 手牌はカード型（`native_card`）のスロットだけが受け付ける。行型には帯を
 * 置く場所が無く、保存しても画面に出ない。行型は絵文字か画像を必須にする。
 *
 * リンクは ASIN か URL のどちらか一方。ASIN が入っていればそちらを使い、
 * URL は保存しない（リンクはトラッキング ID と組み立てる、`resolveAdHref`）。
 * ASIN の欄には Amazon の商品ページの URL を貼ってもよく、そこから ASIN を
 * 取り出す。
 *
 * 遷移先は https に限る。Amazon のリンクはすべて https で、`javascript:` 等を
 * 公開ページのリンクに流さないため。
 *
 * @param imageUrlPrefix ad-creatives バケットの公開 URL の接頭辞
 *   （`<Supabase URL>/storage/v1/object/public/ad-creatives/`）
 */
export function validateAdCreative(
  data: AdCreativeInput,
  imageUrlPrefix: string,
):
  | { readonly ok: true; readonly value: ValidAdCreative }
  | { readonly ok: false; readonly error: AdCreativeValidationError } {
  if (!isAdSlot(data.slot)) return { ok: false, error: "errorSlotInvalid" };

  const asinInput = data.asin.trim();
  const asin = asinInput === "" ? undefined : extractAsin(asinInput);
  if (asinInput !== "" && asin === undefined) {
    return { ok: false, error: "errorAsinInvalid" };
  }
  const href = asin === undefined ? data.href.trim() : undefined;
  if (href !== undefined && !isValidAdHref(href)) {
    return { ok: false, error: "errorHrefInvalid" };
  }

  const icon = data.icon.trim();
  const imageUrl = data.imageUrl.trim();
  const imageAlt = data.imageAlt.trim();
  const hand = data.hand.trim();
  if (hand !== "" && kindForSlot(data.slot) !== "native_card") {
    return { ok: false, error: "errorHandNotForRow" };
  }
  if (icon === "" && imageUrl === "" && hand === "") {
    return { ok: false, error: "errorVisualRequired" };
  }
  if (hand !== "" && !isValidHand(hand)) {
    return { ok: false, error: "errorHandInvalid" };
  }
  if (icon.length > AD_CREATIVE_LIMITS.icon) {
    return { ok: false, error: "errorIconTooLong" };
  }
  if (imageUrl !== "" && !isAdImageUrl(imageUrl, imageUrlPrefix)) {
    return { ok: false, error: "errorImageInvalid" };
  }
  if (
    imageUrl !== "" &&
    (imageAlt === "" || imageAlt.length > AD_CREATIVE_LIMITS.imageAlt)
  ) {
    return { ok: false, error: "errorImageAltRequired" };
  }

  const title = toStoredCopy(data.title, AD_CREATIVE_LIMITS.title);
  const description = toStoredCopy(
    data.description,
    AD_CREATIVE_LIMITS.description,
  );
  if (title === "tooLong" || description === "tooLong") {
    return { ok: false, error: "errorCopyTooLong" };
  }
  if (title[DEFAULT_LOCALE] === undefined) {
    return { ok: false, error: "errorTitleRequired" };
  }

  return {
    ok: true,
    value: {
      slot: data.slot,
      asin,
      href,
      isActive: data.isActive,
      icon: icon === "" ? undefined : icon,
      imageUrl: imageUrl === "" ? undefined : imageUrl,
      imageAlt: imageUrl === "" ? undefined : imageAlt,
      hand: hand === "" ? undefined : hand,
      copy: { title, description },
    },
  };
}

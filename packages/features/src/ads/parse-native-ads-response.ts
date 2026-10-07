import { isHaiKindId, type HaiKindId } from "@mahjong-scoring/core";
import { z } from "zod";

import { AD_KINDS, type NativeAdsResponse } from "./native-ad";

/**
 * JSON は undefined の項目を落とすため、受け取り側では省略を undefined として読む
 */
const nativeAdSchema = z.object({
  id: z.string(),
  kind: z.enum(AD_KINDS),
  href: z.url({ protocol: /^https?$/ }),
  icon: z.string().optional(),
  imageUrl: z.url({ protocol: /^https?$/ }).optional(),
  imageAlt: z.string(),
  hand: z
    .array(
      z.custom<HaiKindId>(
        (value) => typeof value === "number" && isHaiKindId(value),
      ),
    )
    .optional(),
  title: z.string(),
  description: z.string().optional(),
});

const nativeAdsResponseSchema = z.object({
  ads: z.array(nativeAdSchema),
});

/**
 * 広告配信 API の応答を読む。形が合わなければ undefined（広告を出さない）
 * 広告配信応答パース
 *
 * 1 件でも形が合わなければ全体を捨てる。配信側の不整合を部分的に描くより、
 * 広告が出ない方が害が小さい。リンクは http(s) に限る — 受け取った URL は
 * そのまま OS に開かせるため、別のスキームを通すと任意のアプリを起動できる。
 */
export function parseNativeAdsResponse(
  value: unknown,
): NativeAdsResponse | undefined {
  const parsed = nativeAdsResponseSchema.safeParse(value);
  if (!parsed.success) return undefined;
  return {
    ads: parsed.data.ads.map((ad) => ({
      id: ad.id,
      kind: ad.kind,
      href: ad.href,
      icon: ad.icon,
      imageUrl: ad.imageUrl,
      imageAlt: ad.imageAlt,
      hand: ad.hand,
      title: ad.title,
      description: ad.description,
    })),
  };
}

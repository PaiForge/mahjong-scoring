import type { NewAdCreative } from "@/lib/db";
import { kindForSlot, type AdSlot } from "@/lib/ads/registry";

import type { ValidAdCreative } from "./validation";

/**
 * 検証済みの入力を `ad_creatives` の行値にする
 * 広告行変換
 *
 * `kind` はスロットから導出する（管理者は選ばない）。`null` は Drizzle の
 * カラム書き込み境界のため許容される。
 */
export function toAdCreativeRow(
  value: ValidAdCreative,
  slot: AdSlot,
): Pick<
  NewAdCreative,
  "kind" | "slot" | "href" | "isActive" | "icon" | "imagePath" | "imageAlt"
> {
  return {
    kind: kindForSlot(slot),
    slot,
    href: value.href,
    isActive: value.isActive,
    icon: value.icon ?? null,
    imagePath: value.imageUrl ?? null,
    imageAlt: value.imageAlt ?? null,
  };
}

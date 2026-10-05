"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { AMAZON_NETWORK, isValidTrackingId } from "@/lib/ads/amazon";
import { adNetworkSettings, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";

import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * Amazon アソシエイトのトラッキング ID を設定する。空文字なら設定を消す
 * トラッキング ID 設定
 *
 * ASIN で指す広告は、ここで設定した ID とリンクを組み立てて画面に出る
 * （`resolveAdHref`）。設定した時点で広告のキャッシュを捨てるため、掲載中の
 * ASIN 広告は次のリクエストから全スロットに出る。消すと出なくなる。
 */
export async function setAmazonTrackingId(
  trackingId: string,
): Promise<ActionResult<"errorSaveFailed" | "errorTrackingIdInvalid">> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;

  const value = trackingId.trim();
  if (value === "") {
    await db
      .delete(adNetworkSettings)
      .where(eq(adNetworkSettings.network, AMAZON_NETWORK));
  } else {
    if (!isValidTrackingId(value)) return { error: "errorTrackingIdInvalid" };
    await db
      .insert(adNetworkSettings)
      .values({ network: AMAZON_NETWORK, trackingId: value })
      .onConflictDoUpdate({
        target: adNetworkSettings.network,
        set: { trackingId: value, updatedAt: new Date() },
      });
  }

  revalidateAdCreatives();
  return { success: true };
}

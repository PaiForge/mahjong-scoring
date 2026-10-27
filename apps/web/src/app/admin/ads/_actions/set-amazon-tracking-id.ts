"use server";

import { and, eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { AMAZON_NETWORK, isValidTrackingId } from "@/lib/ads/amazon";
import { isAdPlatform } from "@/lib/ads/registry";
import { getClientIp } from "@/lib/client-ip";
import { adNetworkSettings, db } from "@/lib/db";
import { requireAdminActor } from "@/app/admin/_lib/auth";
import {
  adNetworkSettingKey,
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "@/app/admin/_lib/content-action";

import { revalidateAdCreatives } from "../_lib/revalidate";

/**
 * プラットフォーム（web / モバイル）の Amazon アソシエイトのトラッキング ID を
 * 設定する。空文字なら設定を消す
 * トラッキング ID 設定
 *
 * ASIN で指す広告は、スロットを読む側の ID とリンクを組み立てて画面に出る
 * （`resolveAdHref`）。設定した時点で広告のキャッシュを捨てるため、掲載中の
 * ASIN 広告は次のリクエストからそのプラットフォームの全スロットに出る。
 * 消すと出なくなる。
 *
 * トラッキング ID は収益の行き先そのものなので、監査ログに変更前後の値を
 * 残す。未設定・削除は `null`（JSON に「無い」を残すため。設定行は
 * `updated_at` しか持たず、消すと何も残らない）。設定・差し替え・削除を
 * 同じ種別（`set_amazon_tracking_id`）で記録する。
 */
export async function setAmazonTrackingId(
  platform: string,
  trackingId: string,
): Promise<ActionResult<"errorSaveFailed" | "errorTrackingIdInvalid">> {
  const admin = await requireAdminActor("errorSaveFailed");
  if ("error" in admin) return admin;
  if (!isAdPlatform(platform)) return { error: "errorSaveFailed" };

  const value = trackingId.trim();
  if (value !== "" && !isValidTrackingId(value)) {
    return { error: "errorTrackingIdInvalid" };
  }
  const ipAddress = await getClientIp();
  const condition = and(
    eq(adNetworkSettings.network, AMAZON_NETWORK),
    eq(adNetworkSettings.platform, platform),
  );

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ trackingId: adNetworkSettings.trackingId })
      .from(adNetworkSettings)
      .where(condition)
      .for("update");
    if (value === "") {
      await tx.delete(adNetworkSettings).where(condition);
    } else {
      await tx
        .insert(adNetworkSettings)
        .values({ network: AMAZON_NETWORK, platform, trackingId: value })
        .onConflictDoUpdate({
          target: [adNetworkSettings.network, adNetworkSettings.platform],
          set: { trackingId: value, updatedAt: new Date() },
        });
    }
    await recordContentAction(tx, {
      actorId: admin.actorId,
      action: ContentActionKind.SetAmazonTrackingId,
      target: {
        type: ContentActionTargetType.AdNetworkSetting,
        key: adNetworkSettingKey(AMAZON_NETWORK, platform),
      },
      ipAddress,
      metadata: {
        network: AMAZON_NETWORK,
        platform,
        before: current?.trackingId ?? null,
        after: value === "" ? null : value,
      },
    });
  });

  revalidateAdCreatives();
  return { success: true };
}

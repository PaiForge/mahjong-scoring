import { describe, expect, it } from "vitest";

import messages from "@/messages/ja.json";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

import { buildNotificationMessage } from "../notification-message";

const DICTIONARY_KEYS = Object.keys(messages.notifications.messages);

describe("buildNotificationMessage", () => {
  it.each(NOTIFICATION_TYPES)(
    "%s は metadata が空でも辞書にあるキーに落ちる",
    (type) => {
      const { key } = buildNotificationMessage(type, {});
      expect(DICTIONARY_KEYS).toContain(key);
      expect(key).not.toBe("unknown");
    },
  );

  it("登録に無い種別（退役した値）は汎用の文面", () => {
    expect(buildNotificationMessage("follow", {})).toEqual({ key: "unknown" });
  });

  it("パスの購入完了は期限を日本語の日付で差し込む", () => {
    expect(
      buildNotificationMessage("purchase_completed", {
        kind: "pass",
        expiresAt: "2026-10-31T03:00:00.000Z",
      }),
    ).toEqual({
      key: "purchaseCompletedPass",
      values: { until: "2026年10月31日" },
    });
  });

  it("買い切りの購入完了は期限を持たない文面", () => {
    expect(
      buildNotificationMessage("purchase_completed", { kind: "lifetime" }),
    ).toEqual({ key: "purchaseCompletedLifetime" });
  });

  it("付与は期限の有無で文面を分ける", () => {
    expect(
      buildNotificationMessage("benefit_granted", {
        expiresAt: "2026-12-01T00:00:00.000Z",
      }),
    ).toEqual({
      key: "benefitGrantedUntil",
      values: { until: "2026年12月1日" },
    });
    expect(buildNotificationMessage("benefit_granted", {})).toEqual({
      key: "benefitGranted",
    });
  });

  it("購入の取り消しは返金だけ「返金により」と言う", () => {
    expect(
      buildNotificationMessage("purchase_revoked", {
        revokeReason: "refunded",
      }),
    ).toEqual({ key: "purchaseRefunded" });
    expect(
      buildNotificationMessage("purchase_revoked", { revokeReason: "fraud" }),
    ).toEqual({ key: "purchaseRevoked" });
  });

  it("差し込み値のあるキーは辞書側にもプレースホルダがある", () => {
    const withUntil = ["purchaseCompletedPass", "benefitGrantedUntil"];
    for (const key of withUntil) {
      expect(
        messages.notifications.messages[
          key as keyof typeof messages.notifications.messages
        ],
      ).toContain("{until}");
    }
  });
});

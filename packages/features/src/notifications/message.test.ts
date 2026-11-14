import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";
import { buildNotificationDetail, buildNotificationMessage } from "./message";
import { NOTIFICATION_TYPES } from "./types";

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

  it("英語を渡すと期限を英語の日付（JST で切る）で差し込む", () => {
    expect(
      buildNotificationMessage(
        "purchase_completed",
        // UTC 15:30 は JST の翌日
        { kind: "pass", expiresAt: "2026-10-30T15:30:00.000Z" },
        "en",
      ),
    ).toEqual({
      key: "purchaseCompletedPass",
      values: { until: "October 31, 2026" },
    });
  });

  it("言語を省くと日本語を渡したときと同じ（アプリの呼び出しが変わらない）", () => {
    const metadata = { expiresAt: "2026-10-31T03:00:00.000Z" };
    expect(buildNotificationMessage("benefit_granted", metadata)).toEqual(
      buildNotificationMessage("benefit_granted", metadata, "ja"),
    );
  });

  it("期限が日時として読めなければ期限を差し込まない文面", () => {
    expect(
      buildNotificationMessage("purchase_completed", {
        kind: "pass",
        expiresAt: "来月",
      }),
    ).toEqual({ key: "purchaseCompleted" });
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

  it("付与に運営のタイトルがあれば、期限の文を足さずにそのまま出す", () => {
    expect(
      buildNotificationMessage("benefit_granted", {
        expiresAt: "2026-12-01T00:00:00+09:00",
        title: "  永久無料パスが付与されました ",
      }),
    ).toEqual({
      key: "benefitGrantedCustom",
      values: { title: "永久無料パスが付与されました" },
    });
  });

  it("空白だけのタイトルは既定の文面に落とす", () => {
    expect(
      buildNotificationMessage("benefit_granted", { title: "  " }),
    ).toEqual({ key: "benefitGranted" });
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
    expect(messages.notifications.messages.benefitGrantedCustom).toContain(
      "{title}",
    );
    expect(messages.notifications.detail.periodUntil).toContain("{until}");
  });
});

describe("buildNotificationDetail", () => {
  it("本文のある付与は本文と期限の文を返す", () => {
    expect(
      buildNotificationDetail("benefit_granted", {
        expiresAt: "2026-12-01T00:00:00+09:00",
        body: "  ありがとう\nございます ",
      }),
    ).toEqual({
      body: "ありがとう\nございます",
      period: { key: "periodUntil", values: { until: "2026年12月1日" } },
    });
  });

  it("期限の無い付与は無期限の文", () => {
    expect(
      buildNotificationDetail("benefit_granted", { body: "感謝" }),
    ).toEqual({ body: "感謝", period: { key: "periodPermanent" } });
  });

  it("本文が無い・空白だけ・付与以外の種別は詳細を持たない", () => {
    expect(buildNotificationDetail("benefit_granted", {})).toBeUndefined();
    expect(
      buildNotificationDetail("benefit_granted", { body: " " }),
    ).toBeUndefined();
    expect(
      buildNotificationDetail("purchase_completed", { body: "x" }),
    ).toBeUndefined();
  });
});

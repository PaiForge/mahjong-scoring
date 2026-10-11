// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppleNotification, AppleTransaction } from "../verifier";

const { mockRecord, mockRevoke, mockReverse } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockRevoke: vi.fn(),
  mockReverse: vi.fn(),
}));

vi.mock("../record", () => ({ recordAppleTransaction: mockRecord }));
vi.mock("../revoke", () => ({
  revokeAppleTransaction: mockRevoke,
  reverseAppleRevocation: mockReverse,
}));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));

import {
  dispatchAppleNotification,
  notificationTransactionId,
} from "../notifications";

const NOW = new Date("2026-10-11T00:00:00Z");
const SIGNED_AT = new Date("2026-10-11T00:00:05Z");
const OWNER = "11111111-1111-4111-8111-111111111111";

const TRANSACTION: AppleTransaction = {
  transactionId: "2000000000000001",
  originalTransactionId: "2000000000000001",
  bundleId: "help.mahjong.score",
  productId: "help.mahjong.score.pro.lifetime",
  type: "Non-Consumable",
  inAppOwnershipType: "PURCHASED",
  purchaseDate: NOW,
  appAccountToken: OWNER,
  revocationDate: undefined,
  environment: "Production",
  price: 980000,
  currency: "JPY",
};

function notification(
  notificationType: string,
  overrides: Partial<AppleNotification> = {},
): AppleNotification {
  return {
    notificationUuid: "uuid-1",
    notificationType,
    subtype: undefined,
    signedDate: SIGNED_AT,
    environment: "Production",
    transaction: TRANSACTION,
    ...overrides,
  };
}

/** 取り消しが記録表に書く通知の識別 */
function identityOf(notificationType: string) {
  return {
    notificationUuid: "uuid-1",
    notificationType,
    subtype: undefined,
    signedDate: SIGNED_AT,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRecord.mockResolvedValue({ outcome: "recorded", purchaseId: "p1" });
  mockRevoke.mockResolvedValue("revoked");
  mockReverse.mockResolvedValue("reversed");
});

describe("dispatchAppleNotification", () => {
  it("TEST は何もせず処理済み", async () => {
    expect(await dispatchAppleNotification(notification("TEST"), NOW)).toBe(
      true,
    );
    expect(mockRecord).not.toHaveBeenCalled();
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("ONE_TIME_CHARGE は appAccountToken のユーザーに記録する", async () => {
    expect(
      await dispatchAppleNotification(notification("ONE_TIME_CHARGE"), NOW),
    ).toBe(true);
    expect(mockRecord).toHaveBeenCalledWith(OWNER, TRANSACTION, NOW);
  });

  it("ONE_TIME_CHARGE の記録が見送られても処理済み", async () => {
    mockRecord.mockResolvedValue({ outcome: "ownedByAnotherAccount" });

    expect(
      await dispatchAppleNotification(notification("ONE_TIME_CHARGE"), NOW),
    ).toBe(true);
  });

  it.each([undefined, "not-a-uuid"])(
    "ONE_TIME_CHARGE の token が UUID でない（%s）なら記録せず処理済み",
    async (appAccountToken) => {
      expect(
        await dispatchAppleNotification(
          notification("ONE_TIME_CHARGE", {
            transaction: { ...TRANSACTION, appAccountToken },
          }),
          NOW,
        ),
      ).toBe(true);
      expect(mockRecord).not.toHaveBeenCalled();
    },
  );

  it("ONE_TIME_CHARGE に取引が無ければ記録せず処理済み", async () => {
    expect(
      await dispatchAppleNotification(
        notification("ONE_TIME_CHARGE", { transaction: undefined }),
        NOW,
      ),
    ).toBe(true);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("REFUND は refunded で取り消す", async () => {
    expect(await dispatchAppleNotification(notification("REFUND"), NOW)).toBe(
      true,
    );
    expect(mockRevoke).toHaveBeenCalledWith(
      "2000000000000001",
      "refunded",
      identityOf("REFUND"),
      NOW,
    );
  });

  it("REVOKE は revoked で取り消す", async () => {
    expect(await dispatchAppleNotification(notification("REVOKE"), NOW)).toBe(
      true,
    );
    expect(mockRevoke).toHaveBeenCalledWith(
      "2000000000000001",
      "revoked",
      identityOf("REVOKE"),
      NOW,
    );
  });

  it("REFUND の取り消しの日時は取引の revocationDate", async () => {
    const revokedAt = new Date("2026-10-10T12:00:00Z");
    await dispatchAppleNotification(
      notification("REFUND", {
        transaction: { ...TRANSACTION, revocationDate: revokedAt },
      }),
      NOW,
    );
    expect(mockRevoke).toHaveBeenCalledWith(
      "2000000000000001",
      "refunded",
      identityOf("REFUND"),
      revokedAt,
    );
  });

  it("取り消す行が無くても処理済み（後の記録が通知の記録を見る）", async () => {
    mockRevoke.mockResolvedValue("notFound");

    expect(await dispatchAppleNotification(notification("REFUND"), NOW)).toBe(
      true,
    );
  });

  it("REFUND_REVERSED は返金の取り消しを戻す", async () => {
    mockReverse.mockResolvedValue("notFound");

    expect(
      await dispatchAppleNotification(notification("REFUND_REVERSED"), NOW),
    ).toBe(true);
    expect(mockReverse).toHaveBeenCalledWith(
      "2000000000000001",
      identityOf("REFUND_REVERSED"),
    );
  });

  it("CONSUMPTION_REQUEST はログだけで処理済み", async () => {
    expect(
      await dispatchAppleNotification(notification("CONSUMPTION_REQUEST"), NOW),
    ).toBe(true);
    expect(mockRecord).not.toHaveBeenCalled();
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("扱わない種別は false", async () => {
    expect(
      await dispatchAppleNotification(notification("DID_RENEW"), NOW),
    ).toBe(false);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("DB の失敗はそのまま投げる（受け口が 500 で再送させる）", async () => {
    mockRevoke.mockRejectedValue(new Error("db down"));

    await expect(
      dispatchAppleNotification(notification("REFUND"), NOW),
    ).rejects.toThrow("db down");
  });
});

describe("notificationTransactionId", () => {
  it.each(["ONE_TIME_CHARGE", "REFUND", "REVOKE", "REFUND_REVERSED"])(
    "%s は取引 ID を残す",
    (type) => {
      expect(notificationTransactionId(notification(type))).toBe(
        "2000000000000001",
      );
    },
  );

  it.each(["TEST", "CONSUMPTION_REQUEST"])("%s は残さない", (type) => {
    expect(notificationTransactionId(notification(type))).toBe(undefined);
  });
});

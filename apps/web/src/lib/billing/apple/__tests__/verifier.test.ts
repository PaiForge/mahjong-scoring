// @vitest-environment node
import {
  VerificationException,
  VerificationStatus,
} from "@apple/app-store-server-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Production: { transaction: vi.fn(), notification: vi.fn() },
  Sandbox: { transaction: vi.fn(), notification: vi.fn() },
}));

vi.mock("@apple/app-store-server-library", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@apple/app-store-server-library")>();
  /** 課金環境ごとのモックへ振り分ける偽の SignedDataVerifier */
  class FakeSignedDataVerifier {
    private readonly target: (typeof mocks)["Production"];
    constructor(_roots: unknown, _online: unknown, environment: string) {
      this.target =
        environment === "Production" ? mocks.Production : mocks.Sandbox;
    }
    verifyAndDecodeTransaction(jws: string) {
      return this.target.transaction(jws);
    }
    verifyAndDecodeNotification(signedPayload: string) {
      return this.target.notification(signedPayload);
    }
  }
  return { ...actual, SignedDataVerifier: FakeSignedDataVerifier };
});

import { createAppleSignedDataVerifier } from "../verifier";

const PURCHASE_DATE = Date.parse("2026-10-11T00:00:00Z");

function payload(overrides: Record<string, unknown> = {}) {
  return {
    transactionId: "2000000000000001",
    originalTransactionId: "2000000000000001",
    bundleId: "help.mahjong.score",
    productId: "help.mahjong.score.pro.lifetime",
    type: "Non-Consumable",
    inAppOwnershipType: "PURCHASED",
    purchaseDate: PURCHASE_DATE,
    appAccountToken: "11111111-1111-4111-8111-111111111111",
    environment: "Production",
    price: 980000,
    currency: "JPY",
    ...overrides,
  };
}

function exception(status: VerificationStatus) {
  return new VerificationException(status);
}

function verifier() {
  return createAppleSignedDataVerifier({
    appAppleId: 1,
    rootCertificates: [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("verifyTransaction", () => {
  it("Production で通れば自前の形に写す", async () => {
    mocks.Production.transaction.mockResolvedValue(payload());
    expect(await verifier().verifyTransaction("jws")).toEqual({
      ok: true,
      value: {
        transactionId: "2000000000000001",
        originalTransactionId: "2000000000000001",
        bundleId: "help.mahjong.score",
        productId: "help.mahjong.score.pro.lifetime",
        type: "Non-Consumable",
        inAppOwnershipType: "PURCHASED",
        purchaseDate: new Date(PURCHASE_DATE),
        appAccountToken: "11111111-1111-4111-8111-111111111111",
        revocationDate: undefined,
        environment: "Production",
        price: 980000,
        currency: "JPY",
      },
    });
    expect(mocks.Sandbox.transaction).not.toHaveBeenCalled();
  });

  it("INVALID_ENVIRONMENT のときだけ Sandbox で検証し直す", async () => {
    mocks.Production.transaction.mockRejectedValue(
      exception(VerificationStatus.INVALID_ENVIRONMENT),
    );
    mocks.Sandbox.transaction.mockResolvedValue(
      payload({ environment: "Sandbox", revocationDate: PURCHASE_DATE + 1 }),
    );
    const result = await verifier().verifyTransaction("jws");
    expect(result.ok && result.value.environment).toBe("Sandbox");
    expect(result.ok && result.value.revocationDate).toEqual(
      new Date(PURCHASE_DATE + 1),
    );
  });

  it.each([
    VerificationStatus.VERIFICATION_FAILURE,
    VerificationStatus.INVALID_APP_IDENTIFIER,
    VerificationStatus.INVALID_CERTIFICATE,
    VerificationStatus.INVALID_CHAIN_LENGTH,
    VerificationStatus.FAILURE,
  ])(
    "他の検証の失敗（%s）は Sandbox を試さず invalidSignature",
    async (status) => {
      mocks.Production.transaction.mockRejectedValue(exception(status));
      expect(await verifier().verifyTransaction("jws")).toEqual({
        ok: false,
        reason: "invalidSignature",
      });
      expect(mocks.Sandbox.transaction).not.toHaveBeenCalled();
    },
  );

  it("Sandbox でも課金環境が合わなければ invalidSignature", async () => {
    const invalid = exception(VerificationStatus.INVALID_ENVIRONMENT);
    mocks.Production.transaction.mockRejectedValue(invalid);
    mocks.Sandbox.transaction.mockRejectedValue(invalid);
    expect(await verifier().verifyTransaction("jws")).toEqual({
      ok: false,
      reason: "invalidSignature",
    });
  });

  it("OCSP に届かない・想定外の例外は unavailable", async () => {
    mocks.Production.transaction.mockRejectedValueOnce(
      exception(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE),
    );
    expect(await verifier().verifyTransaction("jws")).toEqual({
      ok: false,
      reason: "unavailable",
    });
    mocks.Production.transaction.mockRejectedValueOnce(new Error("boom"));
    expect(await verifier().verifyTransaction("jws")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("記録に要る項目が無ければ invalidSignature", async () => {
    mocks.Production.transaction.mockResolvedValue(
      payload({ productId: undefined }),
    );
    expect(await verifier().verifyTransaction("jws")).toEqual({
      ok: false,
      reason: "invalidSignature",
    });
  });
});

describe("verifyNotification", () => {
  function notification(data: Record<string, unknown> | undefined) {
    return {
      notificationType: "REFUND",
      notificationUUID: "uuid-1",
      signedDate: 1_791_676_800_000,
      data,
    };
  }

  it("外側と内側の両方を検証して読む", async () => {
    mocks.Production.notification.mockResolvedValue(
      notification({ signedTransactionInfo: "inner" }),
    );
    mocks.Production.transaction.mockResolvedValue(payload());
    const result = await verifier().verifyNotification("outer");
    expect(mocks.Production.transaction).toHaveBeenCalledWith("inner");
    expect(result).toMatchObject({
      ok: true,
      value: {
        notificationUuid: "uuid-1",
        notificationType: "REFUND",
        subtype: undefined,
        signedDate: new Date(1_791_676_800_000),
        environment: "Production",
        transaction: { transactionId: "2000000000000001" },
      },
    });
  });

  it("内側の JWS が通らなければ通知全体が不正", async () => {
    mocks.Production.notification.mockResolvedValue(
      notification({ signedTransactionInfo: "inner" }),
    );
    mocks.Production.transaction.mockRejectedValue(
      exception(VerificationStatus.VERIFICATION_FAILURE),
    );
    expect(await verifier().verifyNotification("outer")).toEqual({
      ok: false,
      reason: "invalidSignature",
    });
  });

  it("取引を持たない通知（TEST 等）は transaction が undefined", async () => {
    mocks.Production.notification.mockRejectedValue(
      exception(VerificationStatus.INVALID_ENVIRONMENT),
    );
    mocks.Sandbox.notification.mockResolvedValue({
      ...notification({}),
      notificationType: "TEST",
    });
    expect(await verifier().verifyNotification("outer")).toEqual({
      ok: true,
      value: {
        notificationUuid: "uuid-1",
        notificationType: "TEST",
        subtype: undefined,
        signedDate: new Date(1_791_676_800_000),
        environment: "Sandbox",
        transaction: undefined,
      },
    });
  });

  it("外側の署名不正は invalidSignature で Sandbox を試さない", async () => {
    mocks.Production.notification.mockRejectedValue(
      exception(VerificationStatus.VERIFICATION_FAILURE),
    );
    expect(await verifier().verifyNotification("outer")).toEqual({
      ok: false,
      reason: "invalidSignature",
    });
    expect(mocks.Sandbox.notification).not.toHaveBeenCalled();
  });
});

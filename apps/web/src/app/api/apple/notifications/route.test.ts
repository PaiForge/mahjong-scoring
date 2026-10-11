// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppleNotification } from "@/lib/billing/apple/verifier";
import { createFakeAppleVerifier } from "@/lib/billing/apple/verifier-fake";

const { mockGetVerifier, mockHasProcessed, mockMarkProcessed, mockDispatch } =
  vi.hoisted(() => ({
    mockGetVerifier: vi.fn(),
    mockHasProcessed: vi.fn(),
    mockMarkProcessed: vi.fn(),
    mockDispatch: vi.fn(),
  }));

vi.mock("@/lib/billing/apple/default-verifier", () => ({
  getAppleSignedDataVerifier: mockGetVerifier,
}));
vi.mock("@/lib/billing/apple/notification-events", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/billing/apple/notification-events")
  >()),
  hasProcessedAppleNotification: mockHasProcessed,
  markAppleNotificationProcessed: mockMarkProcessed,
}));
vi.mock("@/lib/billing/apple/notifications", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/billing/apple/notifications")
  >()),
  dispatchAppleNotification: mockDispatch,
}));
vi.mock("@/lib/billing/apple/record", () => ({}));
vi.mock("@/lib/billing/apple/revoke", () => ({}));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));

import { POST } from "./route";

const NOTIFICATION: AppleNotification = {
  notificationUuid: "uuid-1",
  notificationType: "REFUND",
  subtype: undefined,
  environment: "Production",
  transaction: {
    transactionId: "2000000000000001",
    originalTransactionId: "2000000000000001",
    bundleId: "help.mahjong.score",
    productId: "help.mahjong.score.pro.lifetime",
    type: "Non-Consumable",
    inAppOwnershipType: "PURCHASED",
    purchaseDate: new Date("2026-10-11T00:00:00Z"),
    appAccountToken: undefined,
    revocationDate: new Date("2026-10-12T00:00:00Z"),
    environment: "Production",
    price: 980000,
    currency: "JPY",
  },
};

const verifier = createFakeAppleVerifier({
  notifications: new Map([
    ["signed-valid", { ok: true, value: NOTIFICATION } as const],
    ["signed-unavailable", { ok: false, reason: "unavailable" } as const],
  ]),
});

function request(body: unknown = { signedPayload: "signed-valid" }) {
  return new Request("http://localhost/api/apple/notifications", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetVerifier.mockReturnValue(verifier);
  mockHasProcessed.mockResolvedValue(false);
  mockMarkProcessed.mockResolvedValue(undefined);
  mockDispatch.mockResolvedValue(true);
});

describe("POST /api/apple/notifications", () => {
  it.each([{}, { signedPayload: "" }, "not json"])(
    "signedPayload が無ければ 400（%#）",
    async (body) => {
      const res = await POST(request(body));
      expect(res.status).toBe(400);
      expect(mockDispatch).not.toHaveBeenCalled();
    },
  );

  it("署名が通らなければ 400", async () => {
    const res = await POST(request({ signedPayload: "signed-forged" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidSignature" });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("Apple に届かず検証できなければ 500（再送させる）", async () => {
    const res = await POST(request({ signedPayload: "signed-unavailable" }));

    expect(res.status).toBe(500);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("検証器が無い（設定の不備）なら 500", async () => {
    mockGetVerifier.mockReturnValue(undefined);

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("処理済みの通知は処理せず 200", async () => {
    mockHasProcessed.mockResolvedValue(true);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("処理の後に取引 ID 付きで処理済みとして記録し 200", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledWith(NOTIFICATION);
    expect(mockMarkProcessed).toHaveBeenCalledWith({
      notificationUuid: "uuid-1",
      notificationType: "REFUND",
      subtype: undefined,
      transactionId: "2000000000000001",
    });
    expect(mockDispatch.mock.invocationCallOrder[0]).toBeLessThan(
      mockMarkProcessed.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("扱わない種別は処理済みとして記録しない", async () => {
    mockDispatch.mockResolvedValue(false);

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("処理が失敗したら記録せず 500（Apple に再送させる）", async () => {
    mockDispatch.mockRejectedValue(new Error("db down"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });
});

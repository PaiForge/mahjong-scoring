// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeAs } from "@/test/mobile-auth-mock";

import type {
  AppleTransaction,
  AppleVerification,
} from "../billing/apple/verifier";
import { createFakeAppleVerifier } from "../billing/apple/verifier-fake";

const { mockRecord, mockBuildPlan } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockBuildPlan: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../billing/apple/record", () => ({
  recordAppleTransaction: mockRecord,
}));
vi.mock("./plan", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./plan")>()),
  buildMobilePlanResponse: mockBuildPlan,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleRecordAppleTransaction } from "./apple-iap";

const TRANSACTION: AppleTransaction = {
  transactionId: "2000000000000001",
  originalTransactionId: "2000000000000001",
  bundleId: "help.mahjong.score",
  productId: "help.mahjong.score.pro.lifetime",
  type: "Non-Consumable",
  inAppOwnershipType: "PURCHASED",
  purchaseDate: new Date("2026-10-11T00:00:00Z"),
  appAccountToken: undefined,
  revocationDate: undefined,
  environment: "Production",
  price: 980000,
  currency: "JPY",
};

const PLAN = {
  status: { kind: "lifetime" },
  benefits: ["unlimited_practice", "practice_tools"],
  canPurchase: false,
  offers: [],
  purchases: [],
};

const verifier = createFakeAppleVerifier({
  transactions: new Map<string, AppleVerification<AppleTransaction>>([
    ["jws-valid", { ok: true, value: TRANSACTION }],
    ["jws-unavailable", { ok: false, reason: "unavailable" }],
  ]),
});

function request(body: unknown = { jws: "jws-valid" }) {
  return new Request("https://example.test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const handle = (req: Request = request()) =>
  handleRecordAppleTransaction(req, () => verifier);

beforeEach(() => {
  vi.clearAllMocks();
  authorizeAs({ userId: "user-1", username: "bob" });
  mockRecord.mockResolvedValue({ outcome: "recorded", purchaseId: "p1" });
  mockBuildPlan.mockResolvedValue(PLAN);
});

describe("handleRecordAppleTransaction", () => {
  it("検証した取引を Bearer のユーザーで記録し、記録後のプランの状態を返す", async () => {
    const response = await handle();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...PLAN, outcome: "recorded" });
    expect(mockRecord).toHaveBeenCalledWith(
      "user-1",
      TRANSACTION,
      expect.any(Date),
    );
    expect(mockBuildPlan).toHaveBeenCalledWith("user-1", expect.any(Date));
  });

  it("返金済みの取引を履歴として記録したときも recorded", async () => {
    mockRecord.mockResolvedValue({ outcome: "refunded", purchaseId: "p1" });

    expect((await (await handle()).json()).outcome).toBe("recorded");
  });

  it("記録済みなら 200 duplicate", async () => {
    mockRecord.mockResolvedValue({ outcome: "duplicate" });

    const response = await handle();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...PLAN, outcome: "duplicate" });
  });

  it("別のアカウントの取引なら 409 ownedByAnotherAccount", async () => {
    mockRecord.mockResolvedValue({ outcome: "ownedByAnotherAccount" });

    const response = await handle();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "ownedByAnotherAccount" });
  });

  it.each([
    ["unknownProduct", "unknownProduct"],
    ["sandboxNotAccepted", "sandboxNotAccepted"],
    ["unknownBundle", "invalidTransaction"],
    ["unexpectedType", "invalidTransaction"],
    ["familyShared", "invalidTransaction"],
  ])("記録しない理由 %s は 422 %s", async (reason, error) => {
    mockRecord.mockResolvedValue({ outcome: "rejected", reason });

    const response = await handle();

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error });
  });

  it("退会を受け付けたユーザーは 403 deleted", async () => {
    mockRecord.mockResolvedValue({ outcome: "accountUnavailable" });

    const response = await handle();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });

  it("署名が通らなければ記録せず 422 invalidTransaction", async () => {
    const response = await handle(request({ jws: "jws-forged" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "invalidTransaction" });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("Apple に届かなければ 503 appleUnavailable", async () => {
    const response = await handle(request({ jws: "jws-unavailable" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "appleUnavailable" });
  });

  it("検証器を作れない（設定が無い）なら 503 appleUnavailable", async () => {
    const response = await handleRecordAppleTransaction(
      request(),
      () => undefined,
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "appleUnavailable" });
  });

  it("ユーザー名を決める前は 409 usernameRequired", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handle();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it.each([{}, { jws: "" }, { jws: "x".repeat(16_385) }])(
    "本文が不正なら 400 invalidRequest（%#）",
    async (body) => {
      const response = await handle(request(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalidRequest" });
    },
  );

  it("証明書の鎖を含む長さ（8KB を超える）の取引も検証まで通す", async () => {
    const response = await handle(request({ jws: "x".repeat(12_000) }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "invalidTransaction" });
  });

  it("記録に失敗したら 500 serverError", async () => {
    mockRecord.mockRejectedValue(new Error("db down"));

    const response = await handle();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

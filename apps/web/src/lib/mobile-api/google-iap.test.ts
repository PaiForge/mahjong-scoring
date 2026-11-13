// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeAs } from "@/test/mobile-auth-mock";

import type {
  GooglePurchase,
  GoogleVerification,
} from "../billing/google/verifier";
import { createFakeGooglePurchaseVerifier } from "../billing/google/verifier-fake";

const { mockRecord, mockBuildPlan } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockBuildPlan: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../billing/google/record", () => ({
  recordGooglePurchase: mockRecord,
}));
vi.mock("./plan", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./plan")>()),
  buildMobilePlanResponse: mockBuildPlan,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { handleRecordGooglePurchase } from "./google-iap";
import { postJsonRequest } from "@/test/request";

const PURCHASE: GooglePurchase = {
  purchaseToken: "token-valid",
  productId: "help.mahjong.score.pro.lifetime",
  packageName: "help.mahjong.score",
  orderId: "GPA.1234",
  purchaseDate: new Date("2026-11-14T00:00:00Z"),
  state: "purchased",
  environment: "Production",
};

const PLAN = {
  status: { kind: "lifetime" },
  benefits: ["unlimited_practice", "practice_tools"],
  canPurchase: false,
  offers: [],
  purchases: [],
};

const verifier = createFakeGooglePurchaseVerifier(
  new Map<string, GoogleVerification<GooglePurchase>>([
    ["token-valid", { ok: true, value: PURCHASE }],
    ["token-unavailable", { ok: false, reason: "unavailable" }],
  ]),
);

function request(
  body: unknown = {
    productId: "help.mahjong.score.pro.lifetime",
    purchaseToken: "token-valid",
  },
) {
  return postJsonRequest("https://example.test", body);
}

const handle = (req: Request = request()) =>
  handleRecordGooglePurchase(req, () => verifier);

beforeEach(() => {
  vi.clearAllMocks();
  authorizeAs({ userId: "user-1", username: "bob" });
  mockRecord.mockResolvedValue({ outcome: "recorded", purchaseId: "p1" });
  mockBuildPlan.mockResolvedValue(PLAN);
});

describe("handleRecordGooglePurchase", () => {
  it("検証した購入を Bearer のユーザーで記録し、Android の経路のプランの状態を返す", async () => {
    const response = await handle();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...PLAN, outcome: "recorded" });
    expect(mockRecord).toHaveBeenCalledWith(
      "user-1",
      PURCHASE,
      expect.any(Date),
    );
    expect(mockBuildPlan).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
      "android",
    );
  });

  it("記録済みなら 200 duplicate", async () => {
    mockRecord.mockResolvedValue({ outcome: "duplicate" });

    const response = await handle();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...PLAN, outcome: "duplicate" });
  });

  it("別のアカウントの購入なら 409 ownedByAnotherAccount", async () => {
    mockRecord.mockResolvedValue({ outcome: "ownedByAnotherAccount" });

    const response = await handle();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "ownedByAnotherAccount" });
  });

  it.each([
    ["unknownProduct", 422, "unknownProduct"],
    ["testNotAccepted", 422, "sandboxNotAccepted"],
    ["pending", 409, "purchasePending"],
    ["unknownPackage", 422, "invalidTransaction"],
    ["cancelled", 422, "invalidTransaction"],
  ])("記録しない理由 %s は %i %s", async (reason, status, error) => {
    mockRecord.mockResolvedValue({ outcome: "rejected", reason });

    const response = await handle();

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
  });

  it("退会を受け付けたユーザーは 403 deleted", async () => {
    mockRecord.mockResolvedValue({ outcome: "accountUnavailable" });

    const response = await handle();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });

  it("Play が知らないトークンなら記録せず 422 invalidTransaction", async () => {
    const response = await handle(
      request({ productId: "p", purchaseToken: "token-unknown" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "invalidTransaction" });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("Play に届かなければ 503 storeUnavailable", async () => {
    const response = await handle(
      request({ productId: "p", purchaseToken: "token-unavailable" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "storeUnavailable" });
  });

  it("検証器が無い（本物は未実装・モックを選ばない環境）なら 503 storeUnavailable", async () => {
    const response = await handleRecordGooglePurchase(
      request(),
      () => undefined,
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "storeUnavailable" });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前は 409 usernameRequired", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handle();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { productId: "p" },
    { purchaseToken: "t" },
    { productId: "", purchaseToken: "t" },
    { productId: "p", purchaseToken: "" },
    { productId: "x".repeat(256), purchaseToken: "t" },
    { productId: "p", purchaseToken: "x".repeat(2049) },
  ])("本文が不正なら 400 invalidRequest（%#）", async (body) => {
    const response = await handle(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalidRequest" });
  });

  it("上限の長さの購入トークンは検証まで通す", async () => {
    const response = await handle(
      request({ productId: "p", purchaseToken: "x".repeat(2048) }),
    );

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

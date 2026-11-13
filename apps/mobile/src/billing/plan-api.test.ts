import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readPublicMobileApi: vi.fn(),
}));

import { callMobileApi, jsonResponse } from "../test/api-client-mock";

// api-client は React Native を読むので置き換える
vi.mock(
  "../auth/api-client",
  async () => await import("../test/api-client-mock"),
);
vi.mock("../lib/app-site-url", () => ({ SITE_URL: "http://localhost" }));
vi.mock("../app-version/app-version", () => ({ APP_PLATFORM: "ios" }));
vi.mock("../auth/read-public-mobile-api", () => ({
  readPublicMobileApi: mocks.readPublicMobileApi,
}));
// 入口はストアのアダプタ（ネイティブのモジュール）を読むので、記録の要求だけ置き換える
vi.mock("./iap", () => ({
  iapRecordRequestOf: (purchase: { token: string }) => ({
    path: "/api/mobile/v1/iap/apple/transactions",
    body: { jws: purchase.token },
  }),
}));

import { fetchPlanOffers, postPurchase } from "./plan-api";

const PURCHASE = { key: "tx-1", productId: "pro.lifetime", token: "jws" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestPlanApi の失敗の丸め方", () => {
  it("理由の分からない 4xx（本文の検証の 400）は rejected", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(400, { error: "invalidRequest" }),
    );
    expect(await postPurchase("user-a", PURCHASE)).toEqual({
      error: "rejected",
    });
  });

  it("本文の無い 404 も rejected", async () => {
    callMobileApi.mockResolvedValue(new Response("", { status: 404 }));
    expect(await postPurchase("user-a", PURCHASE)).toEqual({
      error: "rejected",
    });
  });

  it("401 は unauthorized のまま", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(401, { error: "unauthorized" }),
    );
    expect(await postPurchase("user-a", PURCHASE)).toEqual({
      error: "unauthorized",
    });
  });

  it("503 の appleUnavailable はそのまま", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(503, { error: "appleUnavailable" }),
    );
    expect(await postPurchase("user-a", PURCHASE)).toEqual({
      error: "appleUnavailable",
    });
  });

  it("500 は serverError", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(500, { error: "internal" }));
    expect(await postPurchase("user-a", PURCHASE)).toEqual({
      error: "serverError",
    });
  });
});

describe("postPurchase", () => {
  it("ストアのアダプタが組んだパスと本文で送る", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(400, { error: "invalidRequest" }),
    );
    await postPurchase("user-a", PURCHASE);
    expect(callMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/iap/apple/transactions",
      expect.objectContaining({ method: "POST", body: { jws: "jws" } }),
    );
  });
});

describe("fetchPlanOffers", () => {
  it("自分の OS をクエリに載せて読む", async () => {
    mocks.readPublicMobileApi.mockResolvedValue({ offers: [] });
    await fetchPlanOffers();
    expect(mocks.readPublicMobileApi).toHaveBeenCalledWith(
      "/api/mobile/v1/plan/offers?platform=ios",
      expect.any(Function),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { callMobileApi, jsonResponse } from "../test/api-client-mock";

// api-client は React Native を読むので置き換える
vi.mock(
  "../auth/api-client",
  async () => await import("../test/api-client-mock"),
);
vi.mock("../lib/app-site-url", () => ({ SITE_URL: "http://localhost" }));

import { postAppleTransaction } from "./plan-api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestPlanApi の失敗の丸め方", () => {
  it("理由の分からない 4xx（本文の検証の 400）は rejected", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(400, { error: "invalidRequest" }),
    );
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "rejected",
    });
  });

  it("本文の無い 404 も rejected", async () => {
    callMobileApi.mockResolvedValue(new Response("", { status: 404 }));
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "rejected",
    });
  });

  it("401 は unauthorized のまま", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(401, { error: "unauthorized" }),
    );
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "unauthorized",
    });
  });

  it("503 の appleUnavailable はそのまま", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(503, { error: "appleUnavailable" }),
    );
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "appleUnavailable",
    });
  });

  it("500 は serverError", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(500, { error: "internal" }));
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "serverError",
    });
  });
});

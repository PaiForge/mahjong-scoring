import { beforeEach, describe, expect, it, vi } from "vitest";
import { isMobileApiErrorCode } from "@mahjong-scoring/features/account/mobile-api";

const mocks = vi.hoisted(() => ({ callMobileApi: vi.fn() }));

// api-client は React Native を読むので、使う関数だけを置き換える
vi.mock("../auth/api-client", () => {
  const errorOf = async (response: Response): Promise<unknown> => {
    const body: unknown = await response.json().catch(() => undefined);
    return typeof body === "object" && body !== null && "error" in body
      ? body.error
      : undefined;
  };
  return {
    callMobileApi: mocks.callMobileApi,
    errorOf,
    apiFailureOf: async (response: Response) => {
      const error = await errorOf(response);
      return isMobileApiErrorCode(error) ? error : "unknown";
    },
  };
});
vi.mock("../lib/app-site-url", () => ({ SITE_URL: "http://localhost" }));

import { postAppleTransaction } from "./plan-api";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestPlanApi の失敗の丸め方", () => {
  it("理由の分からない 4xx（本文の検証の 400）は rejected", async () => {
    mocks.callMobileApi.mockResolvedValue(
      json(400, { error: "invalidRequest" }),
    );
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "rejected",
    });
  });

  it("本文の無い 404 も rejected", async () => {
    mocks.callMobileApi.mockResolvedValue(new Response("", { status: 404 }));
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "rejected",
    });
  });

  it("401 は unauthorized のまま", async () => {
    mocks.callMobileApi.mockResolvedValue(json(401, { error: "unauthorized" }));
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "unauthorized",
    });
  });

  it("503 の appleUnavailable はそのまま", async () => {
    mocks.callMobileApi.mockResolvedValue(
      json(503, { error: "appleUnavailable" }),
    );
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "appleUnavailable",
    });
  });

  it("500 は serverError", async () => {
    mocks.callMobileApi.mockResolvedValue(json(500, { error: "internal" }));
    expect(await postAppleTransaction("user-a", "jws")).toEqual({
      error: "serverError",
    });
  });
});

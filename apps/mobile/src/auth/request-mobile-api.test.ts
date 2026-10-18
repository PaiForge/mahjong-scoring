import { beforeEach, describe, expect, it, vi } from "vitest";

import { callMobileApi, jsonResponse } from "../test/api-client-mock";

// api-client は React Native を読むので置き換える
vi.mock("./api-client", async () => await import("../test/api-client-mock"));

import { domainFailureOf, requestMobileApi } from "./request-mobile-api";

const isDomainError = (value: unknown): value is "conflict" =>
  value === "conflict";

function request() {
  return requestMobileApi(
    "/api/mobile/v1/x",
    { asUser: "user-a" },
    (body) =>
      typeof body === "object" && body !== null && "ok" in body
        ? { ok: true }
        : undefined,
    (response) => domainFailureOf(response, isDomainError),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestMobileApi", () => {
  it("送れなかったときはその理由", async () => {
    callMobileApi.mockResolvedValue("network");
    expect(await request()).toEqual({ error: "network" });
  });

  it("成功の本文が契約の形なら値、違えば unknown", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(200, { ok: true }));
    expect(await request()).toEqual({ value: { ok: true } });
    callMobileApi.mockResolvedValue(jsonResponse(200, { other: 1 }));
    expect(await request()).toEqual({ error: "unknown" });
  });
});

describe("domainFailureOf", () => {
  it("API 固有の理由はそのまま", async () => {
    callMobileApi.mockResolvedValue(jsonResponse(409, { error: "conflict" }));
    expect(await request()).toEqual({ error: "conflict" });
  });

  it("503 以外の 5xx は serverError", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(500, { error: "serverError" }),
    );
    expect(await request()).toEqual({ error: "serverError" });
  });

  it("それ以外は共通の理由", async () => {
    callMobileApi.mockResolvedValue(
      jsonResponse(401, { error: "unauthorized" }),
    );
    expect(await request()).toEqual({ error: "unauthorized" });
    callMobileApi.mockResolvedValue(new Response("", { status: 503 }));
    expect(await request()).toEqual({ error: "unknown" });
  });
});

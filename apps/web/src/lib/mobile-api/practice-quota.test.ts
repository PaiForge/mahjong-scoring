// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeAs } from "@/test/mobile-auth-mock";

const { mockBenefits, mockConsume, mockReadUsage } = vi.hoisted(() => ({
  mockBenefits: vi.fn(),
  mockConsume: vi.fn(),
  mockReadUsage: vi.fn(),
}));

vi.mock("./auth", async () => await import("@/test/mobile-auth-mock"));
vi.mock("../entitlements/has-benefit", () => ({
  getActiveBenefits: mockBenefits,
}));
vi.mock("../practice-quota/consume-user-quota", () => ({
  consumeUserQuota: mockConsume,
}));
vi.mock("../practice-quota/read-user-quota", () => ({
  readUserQuotaUsage: mockReadUsage,
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import {
  handleBeginPracticeQuota,
  handlePeekPracticeQuota,
} from "./practice-quota";

function beginRequest(body: unknown = { menu: "agari-score" }) {
  return new Request(
    "https://example.test/api/mobile/v1/practice-quota/begin",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

function peekRequest(menu = "agari-score") {
  return new Request(
    `https://example.test/api/mobile/v1/practice-quota?menu=${menu}`,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_PASS", "help.mahjong.score.pro.pass30");
  vi.stubEnv(
    "APPLE_IAP_PRODUCT_ID_PRO_LIFETIME",
    "help.mahjong.score.pro.lifetime",
  );
  authorizeAs({ userId: "user-1", username: "bob" });
  mockBenefits.mockResolvedValue(new Set());
  mockConsume.mockResolvedValue({ allowed: true, remaining: 4 });
  mockReadUsage.mockResolvedValue(2);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleBeginPracticeQuota", () => {
  it("無料ユーザーは DB で 1 つ消費し、signedIn を含めずに答える", async () => {
    const response = await handleBeginPracticeQuota(beginRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      allowed: true,
      remaining: 4,
      limit: 5,
      benefits: [],
    });
    expect(mockConsume).toHaveBeenCalledWith(
      "user-1",
      "agari-score",
      expect.any(String),
      5,
    );
  });

  it("App Store で販売していなければ消費せず無制限", async () => {
    vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", "");

    const body = await (await handleBeginPracticeQuota(beginRequest())).json();

    expect(body).toEqual({
      allowed: true,
      remaining: "unlimited",
      limit: "unlimited",
      benefits: [],
    });
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("Pro は消費せず無制限で、特典を返す", async () => {
    mockBenefits.mockResolvedValue(
      new Set(["unlimited_practice", "practice_tools"]),
    );

    const body = await (await handleBeginPracticeQuota(beginRequest())).json();

    expect(body.remaining).toBe("unlimited");
    expect(body.benefits).toEqual(["unlimited_practice", "practice_tools"]);
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("消費が DB の失敗で数えられなければ許可して通す（fail-open）", async () => {
    mockConsume.mockRejectedValue(new Error("db down"));

    const response = await handleBeginPracticeQuota(beginRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      allowed: true,
      remaining: 5,
      limit: 5,
      benefits: [],
    });
  });

  it.each([{ menu: "jantou-fu" }, {}, { menu: 1 }])(
    "回数制限の対象でない練習名は 400 invalidRequest（%#）",
    async (body) => {
      const response = await handleBeginPracticeQuota(beginRequest(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalidRequest" });
      expect(mockConsume).not.toHaveBeenCalled();
    },
  );

  it("ユーザー名を決める前は 409 usernameRequired", async () => {
    authorizeAs({ userId: "user-1" });

    const response = await handleBeginPracticeQuota(beginRequest());

    expect(response.status).toBe(409);
    expect(mockConsume).not.toHaveBeenCalled();
  });
});

describe("handlePeekPracticeQuota", () => {
  it("消費せずに今日の残りを読む", async () => {
    const response = await handlePeekPracticeQuota(peekRequest());

    expect(await response.json()).toEqual({
      allowed: true,
      remaining: 3,
      limit: 5,
      benefits: [],
    });
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("回数制限の対象でない練習名は 400 invalidRequest", async () => {
    const response = await handlePeekPracticeQuota(peekRequest("jantou-fu"));

    expect(response.status).toBe(400);
    expect(mockReadUsage).not.toHaveBeenCalled();
  });

  it("読み取りに失敗したら 500 serverError", async () => {
    mockReadUsage.mockRejectedValue(new Error("db down"));

    const response = await handlePeekPracticeQuota(peekRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

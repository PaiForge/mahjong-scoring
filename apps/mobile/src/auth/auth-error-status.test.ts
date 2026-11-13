import { describe, expect, it } from "vitest";

import { isAuthNetworkError, isAuthRateLimited } from "./auth-error-status";

describe("isAuthRateLimited", () => {
  it("429 だけを回数超過と読む", () => {
    expect(isAuthRateLimited(429)).toBe(true);
    expect(isAuthRateLimited(400)).toBe(false);
    expect(isAuthRateLimited(undefined)).toBe(false);
  });
});

describe("isAuthNetworkError", () => {
  it("status が無い・0 の失敗を通信断と読む", () => {
    expect(isAuthNetworkError(undefined)).toBe(true);
    expect(isAuthNetworkError(0)).toBe(true);
  });

  it("サーバーが答えた失敗は通信断ではない", () => {
    expect(isAuthNetworkError(400)).toBe(false);
    expect(isAuthNetworkError(429)).toBe(false);
    expect(isAuthNetworkError(500)).toBe(false);
  });
});

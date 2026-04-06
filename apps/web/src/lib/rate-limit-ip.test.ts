import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkIpRateLimit,
  checkIpRateLimitGuard,
  _resetStore,
  type IpRateLimitConfig,
} from "./rate-limit-ip";

const defaultConfig: IpRateLimitConfig = {
  maxRequests: 3,
  windowMs: 60_000,
};

beforeEach(() => {
  _resetStore();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkIpRateLimit", () => {
  it("allows the first request", () => {
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: true,
    });
  });

  it("allows requests up to maxRequests", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
        allowed: true,
      });
    }
  });

  it("denies requests exceeding maxRequests within the window", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: false,
    });
  });

  it("resets the window after windowMs elapses", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: false,
    });

    vi.advanceTimersByTime(defaultConfig.windowMs);

    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: true,
    });
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: false,
    });

    expect(checkIpRateLimit("5.6.7.8", "signIn", defaultConfig)).toEqual({
      allowed: true,
    });
  });

  it("tracks different actions independently", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: false,
    });

    expect(checkIpRateLimit("1.2.3.4", "signUp", defaultConfig)).toEqual({
      allowed: true,
    });
  });

  it("cleans up expired entries on subsequent calls", () => {
    checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    checkIpRateLimit("5.6.7.8", "signIn", defaultConfig);

    vi.advanceTimersByTime(defaultConfig.windowMs);

    // This call triggers cleanup; expired entries should be removed.
    // The new entry for a different IP should be allowed with count 1.
    expect(checkIpRateLimit("9.9.9.9", "signIn", defaultConfig)).toEqual({
      allowed: true,
    });
  });

  it("allows exactly maxRequests=1", () => {
    const strictConfig: IpRateLimitConfig = {
      maxRequests: 1,
      windowMs: 10_000,
    };
    expect(checkIpRateLimit("1.2.3.4", "test", strictConfig)).toEqual({
      allowed: true,
    });
    expect(checkIpRateLimit("1.2.3.4", "test", strictConfig)).toEqual({
      allowed: false,
    });
  });
});

describe("checkIpRateLimitGuard", () => {
  it("returns undefined when the request is allowed", () => {
    expect(
      checkIpRateLimitGuard("1.2.3.4", "signIn", defaultConfig),
    ).toBeUndefined();
  });

  it('returns { error: "rateLimited" } when the limit is exceeded', () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimitGuard("1.2.3.4", "signIn", defaultConfig);
    }
    expect(
      checkIpRateLimitGuard("1.2.3.4", "signIn", defaultConfig),
    ).toEqual({ error: "rateLimited" });
  });

  it('uses "unknown" bucket when ip is undefined', () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimitGuard(undefined, "signIn", defaultConfig);
    }
    expect(
      checkIpRateLimitGuard(undefined, "signIn", defaultConfig),
    ).toEqual({ error: "rateLimited" });
  });

  it("does not affect named IP bucket when ip is undefined", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimitGuard(undefined, "signIn", defaultConfig);
    }
    // Named IP should still be allowed
    expect(
      checkIpRateLimitGuard("1.2.3.4", "signIn", defaultConfig),
    ).toBeUndefined();
  });
});

describe("_resetStore", () => {
  it("clears all stored entries", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: false,
    });

    _resetStore();

    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig)).toEqual({
      allowed: true,
    });
  });
});

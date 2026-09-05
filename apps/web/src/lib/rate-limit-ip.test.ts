import { describe, it, expect, beforeEach } from "vitest";
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

/**
 * 判定の基準時刻。`checkIpRateLimit` は現在時刻を引数で受け取るため、
 * 時間の経過はタイマーの差し替えではなく渡す値で表す。
 */
const T0 = 1_700_000_000_000;

beforeEach(() => {
  _resetStore();
});

describe("checkIpRateLimit", () => {
  it("allows the first request", () => {
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: true,
    });
  });

  it("allows requests up to maxRequests", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
        allowed: true,
      });
    }
  });

  it("denies requests exceeding maxRequests within the window", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: false,
    });
  });

  it("still denies one millisecond before the window ends", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }

    const justBeforeReset = T0 + defaultConfig.windowMs - 1;

    expect(
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, justBeforeReset),
    ).toEqual({ allowed: false });
  });

  it("resets the window after windowMs elapses", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: false,
    });

    expect(
      checkIpRateLimit(
        "1.2.3.4",
        "signIn",
        defaultConfig,
        T0 + defaultConfig.windowMs,
      ),
    ).toEqual({ allowed: true });
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: false,
    });

    expect(checkIpRateLimit("5.6.7.8", "signIn", defaultConfig, T0)).toEqual({
      allowed: true,
    });
  });

  it("tracks different actions independently", () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: false,
    });

    expect(checkIpRateLimit("1.2.3.4", "signUp", defaultConfig, T0)).toEqual({
      allowed: true,
    });
  });

  it("cleans up expired entries on subsequent calls", () => {
    checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    checkIpRateLimit("5.6.7.8", "signIn", defaultConfig, T0);

    // This call triggers cleanup; expired entries should be removed.
    // The new entry for a different IP should be allowed with count 1.
    expect(
      checkIpRateLimit(
        "9.9.9.9",
        "signIn",
        defaultConfig,
        T0 + defaultConfig.windowMs,
      ),
    ).toEqual({ allowed: true });
  });

  it("allows exactly maxRequests=1", () => {
    const strictConfig: IpRateLimitConfig = {
      maxRequests: 1,
      windowMs: 10_000,
    };
    expect(checkIpRateLimit("1.2.3.4", "test", strictConfig, T0)).toEqual({
      allowed: true,
    });
    expect(checkIpRateLimit("1.2.3.4", "test", strictConfig, T0)).toEqual({
      allowed: false,
    });
  });

  it("reads the clock itself when no time is given", () => {
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
    expect(checkIpRateLimitGuard("1.2.3.4", "signIn", defaultConfig)).toEqual({
      error: "rateLimited",
    });
  });

  it('uses "unknown" bucket when ip is undefined', () => {
    for (let i = 0; i < defaultConfig.maxRequests; i++) {
      checkIpRateLimitGuard(undefined, "signIn", defaultConfig);
    }
    expect(checkIpRateLimitGuard(undefined, "signIn", defaultConfig)).toEqual({
      error: "rateLimited",
    });
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
      checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0);
    }
    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: false,
    });

    _resetStore();

    expect(checkIpRateLimit("1.2.3.4", "signIn", defaultConfig, T0)).toEqual({
      allowed: true,
    });
  });
});

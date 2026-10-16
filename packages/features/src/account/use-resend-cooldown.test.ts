// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import {
  RESEND_EMAIL_COOLDOWN_SECONDS,
  useResendCooldown,
} from "./use-resend-cooldown";

describe("useResendCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("始めるまでは 0", () => {
    const { result } = renderHook(() => useResendCooldown());
    expect(result.current.cooldown).toBe(0);
  });

  it("始めると 60 秒から 1 秒ごとに減り、0 で止まる", () => {
    const { result } = renderHook(() => useResendCooldown());
    act(() => result.current.start());
    expect(result.current.cooldown).toBe(RESEND_EMAIL_COOLDOWN_SECONDS);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.cooldown).toBe(RESEND_EMAIL_COOLDOWN_SECONDS - 1);

    for (let i = 1; i < RESEND_EMAIL_COOLDOWN_SECONDS + 5; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(result.current.cooldown).toBe(0);
  });
});

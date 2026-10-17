import { describe, expect, it } from "vitest";
import {
  formatElapsedSeconds,
  formatTimerClock,
  timerColorOf,
} from "./timer-display";

describe("formatTimerClock", () => {
  it("秒を 2 桁で埋める", () => {
    expect(formatTimerClock(65)).toBe("1:05");
    expect(formatTimerClock(0)).toBe("0:00");
  });
});

describe("timerColorOf", () => {
  it("6 割で琥珀、8 割で赤に変わる", () => {
    expect(timerColorOf(0.59)).toBe("#22c55e");
    expect(timerColorOf(0.6)).toBe("#f59e0b");
    expect(timerColorOf(0.8)).toBe("#ef4444");
  });
});

describe("formatElapsedSeconds", () => {
  it("ミリ秒を小数 1 桁の秒にする", () => {
    expect(formatElapsedSeconds(0)).toBe("0.0");
    expect(formatElapsedSeconds(7450)).toBe("7.5");
    expect(formatElapsedSeconds(12_000)).toBe("12.0");
  });
});

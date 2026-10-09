import { describe, expect, it } from "vitest";

import { isPracticeMode } from "./practice-mode";

describe("isPracticeMode", () => {
  it("基礎練習と実戦練習だけを受け付ける", () => {
    expect(isPracticeMode("basic")).toBe(true);
    expect(isPracticeMode("practical")).toBe(true);
    expect(isPracticeMode("other")).toBe(false);
    expect(isPracticeMode(null)).toBe(false);
    expect(isPracticeMode(undefined)).toBe(false);
  });
});

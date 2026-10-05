import { describe, expect, it } from "vitest";
import { formatDifference } from "./answer-difference";

const format = (value: number) => `${value}符`;

describe("formatDifference", () => {
  it("多く数えていれば +、足りなければ演算子のマイナス", () => {
    expect(formatDifference({ correct: 30, user: 40, format }, "なし")).toBe(
      "+10符",
    );
    expect(formatDifference({ correct: 40, user: 30, format }, "なし")).toBe(
      "−10符",
    );
  });

  it("差が無ければ文言を返す", () => {
    expect(formatDifference({ correct: 30, user: 30, format }, "なし")).toBe(
      "なし",
    );
  });
});

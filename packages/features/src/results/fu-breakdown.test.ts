import { describe, expect, it } from "vitest";

import { buildFuBreakdown } from "./fu-breakdown";

/** 辞書の形（`{value}符` 等）を真似た翻訳関数。キーの取り違えも見えるよう素通しにしない */
function t(key: string, values?: Record<string, number>): string {
  if (key === "fuSuffix") return `${values?.value}符`;
  return `<${key}>`;
}

const DETAILS = [
  { reason: "副底", fu: 20 },
  { reason: "中張牌の暗刻", fu: 4 },
  { reason: "嵌張待ち", fu: 2 },
];

describe("buildFuBreakdown", () => {
  it("理由ごとの行を出題の順のまま並べ、切り上げ前の合計を締めに置く", () => {
    const breakdown = buildFuBreakdown(DETAILS, 30, t);

    expect(breakdown.title).toBe("<breakdownTitle>");
    expect(breakdown.rows).toEqual([
      { label: "副底", value: "20符" },
      { label: "中張牌の暗刻", value: "4符" },
      { label: "嵌張待ち", value: "2符" },
    ]);
    expect(breakdown.total).toEqual({
      label: "<breakdownTotal>",
      value: "26符",
    });
  });

  it("合計と正解が違う（切り上げた）ときは切り上げの補足を出す", () => {
    expect(buildFuBreakdown(DETAILS, 30, t).note).toBe(
      "26符 → 30符（<roundUp>）",
    );
  });

  it("合計と正解が一致するときは補足を出さない", () => {
    const exact = [
      { reason: "副底", fu: 20 },
      { reason: "門前加符", fu: 10 },
    ];
    expect(buildFuBreakdown(exact, 30, t).note).toBeUndefined();
  });
});

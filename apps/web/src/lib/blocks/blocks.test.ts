import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db: {} }));

import { withoutBlocked } from "./blocks";

const rows = [
  { userId: "a", rank: 1 },
  { userId: "b", rank: 2 },
  { userId: "c", rank: 3 },
];

describe("withoutBlocked", () => {
  it("ブロックした人の行だけを除き、順位は数え直さない", () => {
    expect(withoutBlocked(rows, new Set(["b"]))).toEqual([
      { userId: "a", rank: 1 },
      { userId: "c", rank: 3 },
    ]);
  });

  it("誰もブロックしていなければ同じ配列を返す", () => {
    expect(withoutBlocked(rows, new Set())).toBe(rows);
  });
});

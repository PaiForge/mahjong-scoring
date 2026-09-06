import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("./index", () => ({ db: {} }));

const { selectGrantableRank } = await import("./rank-evaluation");

describe("selectGrantableRank", () => {
  it("次の級の試験で合格点に達していればその1件を返す", () => {
    const run = { menuType: "mangan_exam", score: 10 };
    expect(selectGrantableRank([], run)?.slug).toBe("kyu-5");
  });

  it("合格点ちょうどで合格、1 点足りなければ不合格", () => {
    expect(
      selectGrantableRank([], { menuType: "mangan_exam", score: 10 })?.slug,
    ).toBe("kyu-5");
    expect(
      selectGrantableRank([], { menuType: "mangan_exam", score: 9 }),
    ).toBeUndefined();
  });

  it("上位の試験で合格点を取っても飛び級しない", () => {
    // 無級のまま2級の試験（pinfu_exam）で満点を取っても何も付与されない
    expect(
      selectGrantableRank([], { menuType: "pinfu_exam", score: 99 }),
    ).toBeUndefined();
    // 5級を持っていても、次（4級）を飛ばして3級は付与されない
    expect(
      selectGrantableRank(["kyu-5"], {
        menuType: "chiitoitsu_exam",
        score: 99,
      }),
    ).toBeUndefined();
  });

  it("達成済みの級の試験（再挑戦）では何も付与しない", () => {
    expect(
      selectGrantableRank(["kyu-5"], { menuType: "mangan_exam", score: 99 }),
    ).toBeUndefined();
  });

  it("試験でない練習の走行では何も付与しない", () => {
    expect(
      selectGrantableRank([], { menuType: "jantou_fu", score: 99 }),
    ).toBeUndefined();
  });

  it("飛び番で保持していても、次は最下位の未達成（飛ばした級）", () => {
    expect(
      selectGrantableRank(["kyu-5", "kyu-2"], {
        menuType: "fu_exam",
        score: 99,
      })?.slug,
    ).toBe("kyu-4");
  });

  it("全ランク達成済みなら何も返さない", () => {
    expect(
      selectGrantableRank(
        ["kyu-5", "kyu-4", "kyu-3", "kyu-2", "kyu-1", "dan-1"],
        { menuType: "score_exam", score: 99 },
      ),
    ).toBeUndefined();
  });
});

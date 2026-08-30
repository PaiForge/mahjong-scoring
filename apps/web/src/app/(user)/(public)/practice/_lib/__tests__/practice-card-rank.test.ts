import { describe, expect, it } from "vitest";

import { practiceCardRank } from "../practice-card-rank";

/**
 * 段級位ピルの組み立ての単体検証。
 *
 * 「級を持たない練習にはピルを出さない」は練習一覧とダッシュボードが共有する
 * 分岐だが、現在はカタログの全練習が級を持つため、カードを描画するテストからは
 * この経路を通せない。`rank` は今後も任意のままにする（級の外側の練習を足せる
 * ようにしておく）ので、分岐そのものをここで固定する。
 */
const tRanks = ((key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key) as unknown as Parameters<
  typeof practiceCardRank
>[1];

describe("practiceCardRank", () => {
  it("級を持たない練習にはピルを出さない", () => {
    expect(practiceCardRank(undefined, tRanks)).toBeUndefined();
  });

  it("級を持つ練習にはその級の試験へ送るピルを出す", () => {
    const pill = practiceCardRank("kyu-4", tRanks);

    expect(pill?.slug).toBe("kyu-4");
    expect(pill?.href).toBe("/exam/fu");
  });
});

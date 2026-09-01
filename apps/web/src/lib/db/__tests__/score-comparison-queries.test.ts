import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

let selectCallIndex = 0;
let selectReturnValues: unknown[][] = [];
/** `db.select()` が返したチェーンを呼ばれた順に控える */
let selectChains: QueryChainMock[] = [];

function setupSelectChains(...chains: unknown[][]) {
  selectCallIndex = 0;
  selectReturnValues = chains;
  selectChains = [];
}

vi.mock("server-only", () => ({}));

vi.mock("../index", () => ({
  db: {
    get select() {
      return (..._args: unknown[]) => {
        const idx = selectCallIndex++;
        const resolveValue =
          idx < selectReturnValues.length ? selectReturnValues[idx] : [];
        const chain = createQueryChain(resolveValue);
        selectChains.push(chain);
        return chain;
      };
    },
  },
}));

vi.mock("../schema", async () => await import("@/test/schema-mock"));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { lte, ne } from "drizzle-orm";

import { getScoreComparison } from "../score-comparison-queries";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const USER_ID = "user-a";
const MENU_TYPE = "jantou_fu" as const;
const CURRENT_ID = "result-current";
const CURRENT_ROW = {
  id: CURRENT_ID,
  score: 10,
  createdAt: new Date("2026-08-31T12:00:00.000Z"),
};

describe("getScoreComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grant あり: 今回・ベスト・前回の 3 クエリで比較サマリを返す", async () => {
    setupSelectChains([CURRENT_ROW], [{ score: 12 }], [{ score: 8 }]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      currentScore: 10,
      previousBestScore: 12,
      previousScore: 8,
    });
    expect(selectChains).toHaveLength(3);
    // 過去記録の絞り込みに今回の行の除外条件（id / createdAt）が入る
    expect(ne).toHaveBeenCalledWith("id", CURRENT_ID);
    expect(lte).toHaveBeenCalledWith("created_at", CURRENT_ROW.createdAt);
  });

  it("grant ありでも今回の行が特定できなければ基準点なしで過去記録だけ返す", async () => {
    setupSelectChains([], [{ score: 12 }], [{ score: 8 }]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      currentScore: undefined,
      previousBestScore: 12,
      previousScore: 8,
    });
    // 除外できる行が無いため、除外条件は付かない
    expect(ne).not.toHaveBeenCalled();
    expect(lte).not.toHaveBeenCalled();
  });

  it("grant なし: 今回の行を引かず 2 クエリで過去記録だけ返す", async () => {
    setupSelectChains([{ score: 5 }], [{ score: 5 }]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, undefined);

    expect(result).toEqual({
      currentScore: undefined,
      previousBestScore: 5,
      previousScore: 5,
    });
    expect(selectChains).toHaveLength(2);
  });

  it("過去記録が無ければベスト・前回とも undefined", async () => {
    setupSelectChains([CURRENT_ROW], [], []);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      currentScore: 10,
      previousBestScore: undefined,
      previousScore: undefined,
    });
  });
});

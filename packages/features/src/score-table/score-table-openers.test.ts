import { describe, expect, it, vi } from "vitest";

import { scoreTableOpeners } from "./use-score-table-modal";

describe("scoreTableOpeners", () => {
  it("正解の位置が無ければ、点数表を開く操作をどちらも持たない", () => {
    expect(scoreTableOpeners(undefined, vi.fn())).toEqual({
      openScoreTable: undefined,
      openHighlighted: undefined,
    });
  });

  it("位置があれば、値を押したときはハイライトして開く", () => {
    const open = vi.fn();
    const focus = { isOya: false, isTsumo: false, han: 1, fu: 30 } as never;
    const { openScoreTable, openHighlighted } = scoreTableOpeners(focus, open);
    openHighlighted?.();
    openScoreTable?.(false);
    expect(open.mock.calls).toEqual([[true], [false]]);
  });
});

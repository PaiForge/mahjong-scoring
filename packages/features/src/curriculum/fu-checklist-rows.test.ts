import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { FU_CHECKLIST_ROWS } from "./fu-checklist-rows";

describe("FU_CHECKLIST_ROWS", () => {
  it("符が付く場所を 1 つ以上並べる", () => {
    expect(FU_CHECKLIST_ROWS.length).toBeGreaterThan(0);
  });

  it("行は重複しない", () => {
    expect(new Set(FU_CHECKLIST_ROWS).size).toBe(FU_CHECKLIST_ROWS.length);
  });

  it("どの行も手牌の符の章の辞書に見出し・条件・符を持つ", () => {
    for (const key of FU_CHECKLIST_ROWS) {
      for (const field of ["label", "condition", "fu"]) {
        expect(messages.tehaiFu.learn.checklistRows, key).toHaveProperty([
          key,
          field,
        ]);
      }
    }
  });
});

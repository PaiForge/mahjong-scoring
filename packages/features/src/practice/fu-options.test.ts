import { describe, expect, it } from "vitest";
import {
  compareNumbers,
  generateMentsuJantouFuQuestion,
} from "@mahjong-scoring/core";

import { generateOrThrow } from "@mahjong-scoring/features/test/generate-or-throw";

import { FU_OPTIONS } from "./fu-options";

describe("FU_OPTIONS", () => {
  it("重複なく小さい順に並ぶ", () => {
    expect(new Set(FU_OPTIONS).size).toBe(FU_OPTIONS.length);
    expect([...FU_OPTIONS].sort(compareNumbers)).toEqual([...FU_OPTIONS]);
  });

  it("面子と雀頭の符練習で出題される行の正解の符はどれも選択肢にある", () => {
    // 選択肢に無い符が正解の行は、どのボタンを押しても正解にできない
    const options: readonly number[] = FU_OPTIONS;
    for (let i = 0; i < 100; i++) {
      const question = generateOrThrow(generateMentsuJantouFuQuestion, 100);
      for (const item of question.items) {
        expect(options).toContain(item.fu);
      }
    }
  });
});

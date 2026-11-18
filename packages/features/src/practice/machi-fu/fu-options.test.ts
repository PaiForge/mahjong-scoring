import { describe, expect, it } from "vitest";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";

import { MACHI_FU_OPTIONS } from "./fu-options";

describe("MACHI_FU_OPTIONS", () => {
  it("待ち符練習の正解はどれも選択肢にあり、どの選択肢も正解になりうる", () => {
    // 0符の待ち（両面・双碰）と 2符の待ち（嵌張・辺張・単騎）はどちらも十分な
    // 割合で出るので、200 問あれば両方が現れる
    const answers = new Set<number>();
    for (let i = 0; i < 200; i++) {
      answers.add(generateMachiFuQuestion().answer);
    }
    expect(answers).toEqual(new Set(MACHI_FU_OPTIONS));
  });
});

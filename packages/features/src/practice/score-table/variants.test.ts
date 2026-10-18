import { describe, expect, it } from "vitest";
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";

import { scoreTableDemoPromptOf } from "./variants";

describe("scoreTableDemoPromptOf", () => {
  it("親・満貫以上だけなら親の符の無い満貫", () => {
    expect(scoreTableDemoPromptOf("oya_mangan_plus")).toEqual({
      isOya: true,
      han: MANGAN_MIN_HAN,
      fu: undefined,
    });
  });

  it("子・満貫以上だけなら子の符の無い満貫", () => {
    expect(scoreTableDemoPromptOf("ko_mangan_plus")).toEqual({
      isOya: false,
      han: MANGAN_MIN_HAN,
      fu: undefined,
    });
  });

  it("親・満貫未満なら親の 3翻30符", () => {
    expect(scoreTableDemoPromptOf("oya_non_mangan")).toEqual({
      isOya: true,
      han: 3,
      fu: 30,
    });
  });

  it("すべてなら代表値（子・3翻30符）", () => {
    expect(scoreTableDemoPromptOf("all")).toEqual({
      isOya: false,
      han: 3,
      fu: 30,
    });
  });
});

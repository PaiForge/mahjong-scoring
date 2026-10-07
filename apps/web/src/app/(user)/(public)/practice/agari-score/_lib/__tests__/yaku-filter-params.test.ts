import { describe, expect, it } from "vitest";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";

import { parseYakuValues, yakuTokenOf } from "../yaku-filter-params";

describe("yaku-filter-params", () => {
  it("SCORE_FILTERABLE_YAKU のすべての役が URL トークンを持つ", () => {
    // 対応表（YAKU_TO_KEY）に無い役を allowlist に足すと、URL に載せられず
    // 設定フォームから選んでも黙って条件が消える。追加時は対応表も更新すること。
    for (const name of SCORE_FILTERABLE_YAKU) {
      expect(yakuTokenOf(name), `役「${name}」のトークンが無い`).toBeDefined();
    }
  });

  it("役名 → トークン → 役名 のラウンドトリップが成立する", () => {
    for (const name of SCORE_FILTERABLE_YAKU) {
      const token = yakuTokenOf(name);
      expect(parseYakuValues([token ?? ""])).toEqual([name]);
    }
  });

  it("未知のトークンは黙って捨てる", () => {
    expect(parseYakuValues(["unknown", "kokushi", ""])).toEqual([]);
  });

  it("重複トークンは1つにまとめる", () => {
    const token = yakuTokenOf("平和");
    expect(parseYakuValues([token ?? "", token ?? ""])).toEqual(["平和"]);
  });

  it("allowlist 外の役名にはトークンを発行しない", () => {
    expect(yakuTokenOf("国士無双")).toBeUndefined();
    expect(yakuTokenOf("存在しない役")).toBeUndefined();
  });
});

import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import { RULE_SETTING_TOGGLES } from "./rule-setting-toggles";

describe("RULE_SETTING_TOGGLES", () => {
  it("ルール設定のすべての項目を 1 度ずつ並べる", () => {
    expect(RULE_SETTING_TOGGLES.map(({ field }) => field).sort()).toEqual(
      Object.keys(DEFAULT_RULE_SETTINGS).sort(),
    );
  });

  it("各行の見出しと説明が辞書にある", () => {
    const keys = Object.keys(messages.settings);
    for (const { messageKey } of RULE_SETTING_TOGGLES) {
      expect(keys).toContain(`${messageKey}Title`);
      expect(keys).toContain(`${messageKey}Description`);
    }
  });
});

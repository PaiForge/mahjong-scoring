import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import { MENTSU_JANTOU_FU_HELP_SECTIONS } from "./help-sections";

/** ヘルプの辞書（`mentsuJantouFu.help`） */
const help: Readonly<Record<string, unknown>> = messages.mentsuJantouFu.help;

/** 節の本文（`{title, body}`）を持つ辞書のキー。ボタンの label・見出しの title は節ではない */
function sectionKeysInDictionary(): readonly string[] {
  return Object.entries(help)
    .filter(([, value]) => typeof value === "object" && value !== null)
    .map(([key]) => key);
}

describe("MENTSU_JANTOU_FU_HELP_SECTIONS", () => {
  it("どの節も辞書に見出しと本文を持つ", () => {
    for (const section of MENTSU_JANTOU_FU_HELP_SECTIONS) {
      const entry = help[section];
      expect(entry, section).toEqual({
        title: expect.any(String),
        body: expect.any(String),
      });
    }
  });

  it("辞書にある節を過不足なく、重複なく並べる", () => {
    expect(new Set(MENTSU_JANTOU_FU_HELP_SECTIONS).size).toBe(
      MENTSU_JANTOU_FU_HELP_SECTIONS.length,
    );
    expect(new Set(MENTSU_JANTOU_FU_HELP_SECTIONS)).toEqual(
      new Set(sectionKeysInDictionary()),
    );
  });
});

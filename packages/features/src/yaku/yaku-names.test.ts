import { describe, expect, it } from "vitest";

import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { YAKU_TO_KEY } from "./yaku-labels";

/**
 * 役名の辞書（`yakuNames`）と core の役名の対応の検査
 *
 * 役一覧・レッスンは役名を `yakuNames.<YAKU_TO_KEY[core の役名]>` から引く。
 * 日本語の値が core の役名からずれると、日本語の役一覧の表示が黙って変わる。
 */
const jaYakuNames: Readonly<Record<string, string>> = jaMessages.yakuNames;
const enYakuNames: Readonly<Record<string, string>> = enMessages.yakuNames;

describe("yakuNames", () => {
  it("日本語のキー集合が YAKU_TO_KEY の値の集合と一致する", () => {
    expect(Object.keys(jaYakuNames).sort()).toEqual(
      [...new Set(Object.values(YAKU_TO_KEY))].sort(),
    );
  });

  it("日本語の値は YAKU_TO_KEY の日本語のキー（core の役名の表記）と一致する", () => {
    for (const [name, key] of Object.entries(YAKU_TO_KEY)) {
      expect(jaYakuNames[key], key).toBe(name);
    }
  });

  it("core の YAKU_HAN_ENTRIES の役名はすべて辞書キーを持ち、日本語の値が役名そのもの", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      const key = YAKU_TO_KEY[entry.name];
      expect(key, entry.name).toBeDefined();
      expect(jaYakuNames[key], entry.name).toBe(entry.name);
    }
  });

  it("英語の辞書も同じキー集合を持つ", () => {
    expect(Object.keys(enYakuNames).sort()).toEqual(
      Object.keys(jaYakuNames).sort(),
    );
  });
});

import { describe, expect, it } from "vitest";
import { FU_VALUES, YAKUMAN_HAN } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";

import { practiceFuOptions, practiceHanOptions } from "./answer-options";

/** 辞書の代わり。キーをそのまま返す */
const t = (key: string) => key;

/** 翻訳関数が引くキーが `agariScore` 名前空間の辞書にあるか */
function hasAgariScoreKey(key: string): boolean {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages.agariScore,
    );
  return typeof value === "string";
}

/** 選択肢の生成中に引いたキーを集める翻訳関数 */
function recordingTranslator(): {
  readonly t: (key: string) => string;
  readonly keys: string[];
} {
  const keys: string[] = [];
  return {
    t: (key: string) => {
      keys.push(key);
      return key;
    },
    keys,
  };
}

describe("practiceHanOptions", () => {
  it("既定では 1〜4翻のあとに満貫以上の区分を昇順で並べる", () => {
    const options = practiceHanOptions(t, false, false);
    expect(options.map((o) => o.value)).toEqual([1, 2, 3, 4, 5, 6, 8, 11, 13]);
    expect(options[0]).toEqual({ value: 1, label: "1form.options.hanSuffix" });
    expect(options[4]).toEqual({ value: 5, label: "form.options.mangan" });
    expect(options.at(-1)).toEqual({
      value: 13,
      label: "form.options.yakuman",
    });
  });

  it("ダブル役満を採用すると、既定の並びの最後にダブル役満が加わる", () => {
    const options = practiceHanOptions(t, false, true);
    expect(options.map((o) => o.value)).toEqual([
      1, 2, 3, 4, 5, 6, 8, 11, 13, 26,
    ]);
    expect(options.at(-1)?.label).toBe("form.options.doubleYakuman");
  });

  it("5翻以上も翻数で答える設定では役満未満を数値で出し、役満だけを区分名にする", () => {
    const options = practiceHanOptions(t, true, false);
    expect(options).toHaveLength(13);
    expect(options.slice(0, YAKUMAN_HAN - 1)).toEqual(
      Array.from({ length: YAKUMAN_HAN - 1 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}form.options.hanSuffix`,
      })),
    );
    expect(options.at(-1)).toEqual({
      value: 13,
      label: "form.options.yakuman",
    });
  });

  it("翻数で答える設定でダブル役満を採用すると、役満とダブル役満が区分名で並ぶ", () => {
    const options = practiceHanOptions(t, true, true);
    expect(options.slice(-2)).toEqual([
      { value: 13, label: "form.options.yakuman" },
      { value: 26, label: "form.options.doubleYakuman" },
    ]);
  });

  it("引く辞書キーはすべて agariScore の辞書にある", () => {
    const recorder = recordingTranslator();
    practiceHanOptions(recorder.t, false, true);
    practiceHanOptions(recorder.t, true, true);
    expect(recorder.keys.length).toBeGreaterThan(0);
    for (const key of recorder.keys) {
      expect(hasAgariScoreKey(key), key).toBe(true);
    }
  });
});

describe("practiceFuOptions", () => {
  it("符の候補ごとに、値と符の接尾辞を付けた表示を並べる", () => {
    const options = practiceFuOptions(t);
    expect(options).toEqual(
      FU_VALUES.map((value) => ({
        value,
        label: `${value}form.options.fuSuffix`,
      })),
    );
  });

  it("引く辞書キーは agariScore の辞書にある", () => {
    const recorder = recordingTranslator();
    practiceFuOptions(recorder.t);
    expect(recorder.keys.length).toBeGreaterThan(0);
    for (const key of recorder.keys) {
      expect(hasAgariScoreKey(key), key).toBe(true);
    }
  });
});

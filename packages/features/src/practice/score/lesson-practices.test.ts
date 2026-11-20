import { describe, expect, it } from "vitest";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";

import { isCurriculumChapterSlug } from "../../curriculum/registry";
import { parseHandShape } from "./hand-shape-param";
import {
  LESSON_SCORE_PRACTICES,
  lessonScorePractice,
} from "./lesson-practices";

/** 名前空間付きの辞書キーを日本語の辞書から引く（無ければ undefined） */
function lookupJa(key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? Reflect.get(node, part)
          : undefined,
      messages,
    );
}

describe("LESSON_SCORE_PRACTICES", () => {
  it("役の絞り込みは生成器が作れる役だけを使う", () => {
    for (const { pick } of Object.values(LESSON_SCORE_PRACTICES)) {
      for (const name of pick.yaku ?? []) {
        expect(SCORE_FILTERABLE_YAKU).toContain(name);
      }
    }
  });

  it("ボタンの文言の辞書キーはどれも日本語の辞書にあり、章ごとに異なる", () => {
    const keys = Object.values(LESSON_SCORE_PRACTICES).map((p) => p.labelKey);
    for (const key of keys) {
      expect(typeof lookupJa(key), key).toBe("string");
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("どの章の練習も満貫未満だけを出す", () => {
    for (const { pick } of Object.values(LESSON_SCORE_PRACTICES)) {
      expect(pick.ranges).toEqual(["nonMangan"]);
    }
  });

  it("どの章の練習も役か手の形で章の内容に絞り、役は空でなく手の形は URL で読める値", () => {
    for (const { pick } of Object.values(LESSON_SCORE_PRACTICES)) {
      expect(pick.yaku !== undefined || pick.handShape !== undefined).toBe(
        true,
      );
      if (pick.yaku !== undefined) {
        expect(pick.yaku.length).toBeGreaterThan(0);
      }
      if (pick.handShape !== undefined) {
        expect(parseHandShape(pick.handShape)).toBe(pick.handShape);
      }
    }
  });

  it("章ごとに絞り込みの中身が異なる", () => {
    const picks = Object.values(LESSON_SCORE_PRACTICES).map((p) =>
      JSON.stringify(p.pick),
    );
    expect(new Set(picks).size).toBe(picks.length);
  });

  it("どれも目次にある章に結び付く", () => {
    for (const slug of Object.keys(LESSON_SCORE_PRACTICES)) {
      expect(isCurriculumChapterSlug(slug)).toBe(true);
    }
  });
});

describe("lessonScorePractice", () => {
  it("章の slug から引ける", () => {
    expect(lessonScorePractice("pinfu-score")?.pick.yaku).toEqual(["平和"]);
  });

  it("絞り込み練習を持たない章・未知の値・未指定は undefined", () => {
    expect(lessonScorePractice("jantou-fu")).toBeUndefined();
    expect(lessonScorePractice("toString")).toBeUndefined();
    expect(lessonScorePractice(undefined)).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import { HaiKind, type Kazehai, kazeNameKey } from "@mahjong-scoring/core";

import type { LessonChoice, LessonPrompt } from "./quiz";
import {
  formatLessonPoints,
  lessonAnswerLabel,
  lessonChoiceLabel,
  lessonConditionValues,
} from "./quiz-labels";

/** 辞書の代わりに、キーと差し込み値をそのまま書き出す翻訳関数 */
const t = (key: string, values?: Record<string, string | number>): string =>
  values ? `${key}(${JSON.stringify(values)})` : key;

const tScoreTable = (key: string): string => `tier:${key}`;

const ENGLISH_KAZE_NAMES: Readonly<Record<string, string>> = {
  ton: "East",
  nan: "South",
  sha: "West",
  pei: "North",
};

describe("formatLessonPoints", () => {
  it("言語を省くと日本語の桁区切り（従来どおり）", () => {
    expect(formatLessonPoints(12000)).toBe("12,000");
    expect(formatLessonPoints(12000)).toBe(formatLessonPoints(12000, "ja"));
    expect(formatLessonPoints(800)).toBe("800");
  });

  it("英語も 3 桁ごとのカンマで区切る", () => {
    expect(formatLessonPoints(48000, "en")).toBe("48,000");
  });
});

describe("lessonChoiceLabel・lessonAnswerLabel", () => {
  const choices: readonly LessonChoice[] = [
    { kind: "points", points: 12000 },
    { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
    { kind: "oyaTsumo", all: 4000 },
    { kind: "han", han: 3 },
    { kind: "yakuman" },
    { kind: "fu", fu: 40 },
  ];

  it.each(choices)("言語を省くと日本語を渡したときと同じ（%o）", (choice) => {
    expect(lessonChoiceLabel(choice, t)).toBe(
      lessonChoiceLabel(choice, t, "ja"),
    );
    expect(lessonAnswerLabel(choice, t)).toBe(
      lessonAnswerLabel(choice, t, "ja"),
    );
  });

  it("点数・子のツモは辞書を通さず桁区切りで組む", () => {
    expect(lessonChoiceLabel({ kind: "points", points: 12000 }, t)).toBe(
      "12,000",
    );
    expect(
      lessonChoiceLabel({ kind: "koTsumo", fromKo: 2000, fromOya: 4000 }, t),
    ).toBe("2,000 / 4,000");
  });

  it("英語を渡すと英語の桁区切りで差し込む", () => {
    expect(lessonChoiceLabel({ kind: "oyaTsumo", all: 4000 }, t, "en")).toBe(
      'choiceLabels.oyaTsumo({"all":"4,000"})',
    );
    expect(lessonAnswerLabel({ kind: "points", points: 12000 }, t, "en")).toBe(
      'answerLabels.points({"points":"12,000"})',
    );
  });
});

describe("lessonConditionValues", () => {
  const jantou: LessonPrompt = {
    kind: "jantou",
    tile: HaiKind.Haku,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
  };
  const agari: LessonPrompt = {
    kind: "agari",
    role: "ko",
    winType: "ron",
    yaku: ["立直", "平和", "断么九"],
    han: 3,
  };

  it("options を省くと風は日本語の名前、役は「＋」でつなぐ（モバイルの出力）", () => {
    expect(lessonConditionValues(jantou, tScoreTable)).toEqual({
      bakaze: "東",
      jikaze: "南",
    });
    expect(lessonConditionValues(agari, tScoreTable)).toEqual({
      role: "ko",
      winType: "ron",
      yaku: "立直＋平和＋断么九",
      han: 3,
    });
  });

  it("kazeName を渡すと場風・自風をその名前で差し込む", () => {
    const kazeName = (kaze: Kazehai): string =>
      ENGLISH_KAZE_NAMES[kazeNameKey(kaze)] ?? "";
    expect(lessonConditionValues(jantou, tScoreTable, { kazeName })).toEqual({
      bakaze: "East",
      jikaze: "South",
    });
  });

  it("yakuJoiner を渡すと役をその文字列でつなぐ", () => {
    expect(
      lessonConditionValues(agari, tScoreTable, { yakuJoiner: " + " }).yaku,
    ).toBe("立直 + 平和 + 断么九");
  });

  it("yakuName を省くと役名は core の日本語のまま（役の問題も同じ）", () => {
    expect(
      lessonConditionValues(
        { kind: "yaku", yaku: "混一色", naki: true },
        tScoreTable,
      ),
    ).toEqual({ yaku: "混一色", state: "naki" });
  });

  it("yakuName を渡すと役名を 1 つずつ変換してからつなぐ", () => {
    const yakuName = (name: string): string => `en:${name}`;
    expect(
      lessonConditionValues(agari, tScoreTable, {
        yakuName,
        yakuJoiner: " + ",
      }).yaku,
    ).toBe("en:立直 + en:平和 + en:断么九");
    expect(
      lessonConditionValues(
        { kind: "yaku", yaku: "混一色", naki: false },
        tScoreTable,
        { yakuName },
      ),
    ).toEqual({ yaku: "en:混一色", state: "menzen" });
  });

  it("片方だけ渡しても、もう片方は日本語の既定のまま", () => {
    expect(
      lessonConditionValues(agari, tScoreTable, { kazeName: () => "X" }).yaku,
    ).toBe("立直＋平和＋断么九");
    expect(
      lessonConditionValues(jantou, tScoreTable, { yakuJoiner: " + " }),
    ).toEqual({ bakaze: "東", jikaze: "南" });
  });
});

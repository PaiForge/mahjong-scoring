import { describe, expect, it } from "vitest";

import {
  getKazeName,
  HaiKind,
  type Kazehai,
  kazeNameKey,
} from "@mahjong-scoring/core";

import type { LessonPrompt } from "./quiz";
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

/** 日本語の出力に使う引数（以前の既定値） */
const JA_CONDITION_OPTIONS = {
  kazeName: getKazeName,
  yakuJoiner: "＋",
  yakuName: (name: string): string => name,
};

const ENGLISH_KAZE_NAMES: Readonly<Record<string, string>> = {
  ton: "East",
  nan: "South",
  sha: "West",
  pei: "North",
};

describe("formatLessonPoints", () => {
  it("日本語は 3 桁ごとのカンマで区切る", () => {
    expect(formatLessonPoints(12000, "ja")).toBe("12,000");
    expect(formatLessonPoints(800, "ja")).toBe("800");
  });

  it("英語も 3 桁ごとのカンマで区切る", () => {
    expect(formatLessonPoints(48000, "en")).toBe("48,000");
  });
});

describe("lessonChoiceLabel・lessonAnswerLabel", () => {
  it("点数・子のツモは辞書を通さず桁区切りで組む", () => {
    expect(lessonChoiceLabel({ kind: "points", points: 12000 }, t, "ja")).toBe(
      "12,000",
    );
    expect(
      lessonChoiceLabel(
        { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
        t,
        "ja",
      ),
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

  it("日本語の options では風は日本語の名前、役は「＋」でつなぐ（モバイルの出力）", () => {
    expect(
      lessonConditionValues(jantou, tScoreTable, JA_CONDITION_OPTIONS),
    ).toEqual({
      bakaze: "東",
      jikaze: "南",
    });
    expect(
      lessonConditionValues(agari, tScoreTable, JA_CONDITION_OPTIONS),
    ).toEqual({
      role: "ko",
      winType: "ron",
      yaku: "立直＋平和＋断么九",
      han: 3,
    });
  });

  it("kazeName を渡すと場風・自風をその名前で差し込む", () => {
    const kazeName = (kaze: Kazehai): string =>
      ENGLISH_KAZE_NAMES[kazeNameKey(kaze)] ?? "";
    expect(
      lessonConditionValues(jantou, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        kazeName,
      }),
    ).toEqual({
      bakaze: "East",
      jikaze: "South",
    });
  });

  it("yakuJoiner を渡すと役をその文字列でつなぐ", () => {
    expect(
      lessonConditionValues(agari, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        yakuJoiner: " + ",
      }).yaku,
    ).toBe("立直 + 平和 + 断么九");
  });

  it("yakuName が素通しなら役名は core の日本語のまま（役の問題も同じ）", () => {
    expect(
      lessonConditionValues(
        { kind: "yaku", yaku: "混一色", naki: true },
        tScoreTable,
        JA_CONDITION_OPTIONS,
      ),
    ).toEqual({ yaku: "混一色", state: "naki" });
  });

  it("yakuName を渡すと役名を 1 つずつ変換してからつなぐ", () => {
    const yakuName = (name: string): string => `en:${name}`;
    expect(
      lessonConditionValues(agari, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        yakuName,
        yakuJoiner: " + ",
      }).yaku,
    ).toBe("en:立直 + en:平和 + en:断么九");
    expect(
      lessonConditionValues(
        { kind: "yaku", yaku: "混一色", naki: false },
        tScoreTable,
        { ...JA_CONDITION_OPTIONS, yakuName },
      ),
    ).toEqual({ yaku: "en:混一色", state: "menzen" });
  });

  it("一部だけ差し替えても、残りは日本語の値のまま", () => {
    expect(
      lessonConditionValues(agari, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        kazeName: () => "X",
      }).yaku,
    ).toBe("立直＋平和＋断么九");
    expect(
      lessonConditionValues(jantou, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        yakuJoiner: " + ",
      }),
    ).toEqual({ bakaze: "東", jikaze: "南" });
  });
});

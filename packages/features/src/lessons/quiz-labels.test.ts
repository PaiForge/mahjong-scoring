import { describe, expect, it } from "vitest";

import {
  getKazeName,
  HaiKind,
  type Kazehai,
  kazeNameKey,
  MentsuType,
} from "@mahjong-scoring/core";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import type { LessonChoice, LessonPrompt } from "./quiz";
import { lessonQuiz } from "./quizzes";
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

/** ドット区切りのキーで辞書の値を引く（無ければ undefined） */
function resolveMessage(dictionary: unknown, key: string): unknown {
  let node: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Readonly<Record<string, unknown>>)[segment];
  }
  return node;
}

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

  it("単位や語が付く選択肢（翻・役満・符）は辞書から引いて値を差し込む", () => {
    expect(lessonChoiceLabel({ kind: "han", han: 3 }, t, "ja")).toBe(
      'choiceLabels.han({"han":3})',
    );
    expect(lessonChoiceLabel({ kind: "yakuman" }, t, "ja")).toBe(
      "choiceLabels.yakuman",
    );
    expect(lessonChoiceLabel({ kind: "fu", fu: 40 }, t, "ja")).toBe(
      'choiceLabels.fu({"fu":40})',
    );
  });

  it("正解ラベルは点数・子のツモにだけ「点」を付け、ほかはボタンと同じ文字列", () => {
    expect(
      lessonAnswerLabel(
        { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
        t,
        "ja",
      ),
    ).toBe('answerLabels.points({"points":"2,000 / 4,000"})');
    const unitChoices: readonly LessonChoice[] = [
      { kind: "oyaTsumo", all: 4000 },
      { kind: "han", han: 2 },
      { kind: "yakuman" },
      { kind: "fu", fu: 30 },
    ];
    for (const choice of unitChoices) {
      expect(lessonAnswerLabel(choice, t, "ja")).toBe(
        lessonChoiceLabel(choice, t, "ja"),
      );
    }
  });

  it("選択肢・正解ラベルが引くキーは日本語・英語の辞書（lessons）にある", () => {
    const usedKeys = new Set<string>();
    const recording = (key: string): string => {
      usedKeys.add(key);
      return key;
    };
    const choices: readonly LessonChoice[] = [
      { kind: "points", points: 1000 },
      { kind: "koTsumo", fromKo: 300, fromOya: 500 },
      { kind: "oyaTsumo", all: 500 },
      { kind: "han", han: 1 },
      { kind: "yakuman" },
      { kind: "fu", fu: 20 },
    ];
    for (const choice of choices) {
      lessonChoiceLabel(choice, recording, "ja");
      lessonAnswerLabel(choice, recording, "ja");
    }
    expect(usedKeys.size).toBeGreaterThan(0);
    for (const key of usedKeys) {
      expect(resolveMessage(jaMessages.lessons, key), key).toBeTypeOf("string");
      expect(resolveMessage(enMessages.lessons, key), key).toBeTypeOf("string");
    }
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

  it("帯の問題は翻数と、scoreTable の辞書から引いた帯の名前を差し込む", () => {
    expect(
      lessonConditionValues(
        { kind: "tier", tierKey: "haneman", han: 6 },
        tScoreTable,
        JA_CONDITION_OPTIONS,
      ),
    ).toEqual({ han: 6, tier: "tier:haneman" });
  });

  it("面子の問題は形の名前を差し込み、形ごとに相異なる名前になる", () => {
    const shapeOf = (prompt: LessonPrompt): unknown =>
      lessonConditionValues(prompt, tScoreTable, JA_CONDITION_OPTIONS).shape;
    const shuntsu = shapeOf({
      kind: "mentsu",
      mentsu: {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
      },
    });
    const [koutsu, , kantsu] = lessonQuiz("mentsu-fu").questions.map(
      ({ prompt }) => shapeOf(prompt),
    );
    expect([shuntsu, koutsu, kantsu]).toEqual(["shuntsu", "koutsu", "kantsu"]);
  });

  it("面子の形の名前は、日本語・英語の条件文の select の分岐の名前と一致する", () => {
    // 槓子は other の分岐で受けるので、名前を持つのは順子と刻子
    for (const condition of [
      jaMessages.lessons.mentsuFu.condition,
      enMessages.lessons.mentsuFu.condition,
    ]) {
      expect(condition).toContain("shuntsu {");
      expect(condition).toContain("koutsu {");
    }
  });

  it("待ちの問題は条件文に差し込む値を持たない（牌から読ませる）", () => {
    expect(
      lessonConditionValues(
        {
          kind: "machi",
          tiles: [HaiKind.PinZu3, HaiKind.PinZu4],
          agariHai: HaiKind.PinZu5,
        },
        tScoreTable,
        JA_CONDITION_OPTIONS,
      ),
    ).toEqual({});
  });

  it("手牌の問題は場風・自風の名前と、ツモ / ロンを差し込む", () => {
    const [furoRon, furoTsumo] = lessonQuiz("tehai-fu").questions;
    expect(
      lessonConditionValues(furoRon.prompt, tScoreTable, JA_CONDITION_OPTIONS),
    ).toEqual({ bakaze: "東", jikaze: "南", winType: "ron" });
    expect(
      lessonConditionValues(furoTsumo.prompt, tScoreTable, {
        ...JA_CONDITION_OPTIONS,
        kazeName: (kaze) => ENGLISH_KAZE_NAMES[kazeNameKey(kaze)] ?? "",
      }),
    ).toEqual({ bakaze: "East", jikaze: "South", winType: "tsumo" });
  });

  it("積み上げた符の問題は手の形・ツモ / ロン・積み上げた符を差し込む", () => {
    expect(
      lessonConditionValues(
        { kind: "extraFu", handShape: "furo", winType: "tsumo", extraFu: 10 },
        tScoreTable,
        JA_CONDITION_OPTIONS,
      ),
    ).toEqual({ handShape: "furo", winType: "tsumo", extraFu: 10 });
  });
});

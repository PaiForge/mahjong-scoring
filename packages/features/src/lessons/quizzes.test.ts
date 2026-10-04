import { describe, expect, it } from "vitest";
import {
  HaiKind,
  MentsuType,
  calculateTotalFu,
  type AgariContext,
} from "@mahjong-scoring/core";

import { choiceKey, isSameChoice } from "./quiz";
import { lessonQuiz } from "./quizzes";
import { LESSON_SLUGS } from "./registry";

describe("lessonQuiz", () => {
  it.each(LESSON_SLUGS)(
    "%s: 問題があり、正解はすべて選択肢に含まれる",
    (slug) => {
      const quiz = lessonQuiz(slug);
      expect(quiz.questions.length).toBeGreaterThan(0);
      for (const question of quiz.questions) {
        expect(
          quiz.choices.some((choice) => isSameChoice(choice, question.answer)),
        ).toBe(true);
      }
    },
  );

  it.each(LESSON_SLUGS)("%s: 選択肢と問題の辞書キーは重複しない", (slug) => {
    const quiz = lessonQuiz(slug);
    const choiceKeys = quiz.choices.map(choiceKey);
    expect(new Set(choiceKeys).size).toBe(choiceKeys.length);
    const questionKeys = quiz.questions.map((question) => question.key);
    expect(new Set(questionKeys).size).toBe(questionKeys.length);
  });

  it("子のロン: 満貫 → 跳満 → 倍満 の 3 問で、翻数と点数が点数表と一致する", () => {
    const quiz = lessonQuiz("mangan-ko-ron");
    expect(quiz.questions).toEqual([
      {
        key: "mangan",
        prompt: { kind: "tier", tierKey: "mangan", han: 5 },
        answer: { kind: "points", points: 8000 },
      },
      {
        key: "haneman",
        prompt: { kind: "tier", tierKey: "haneman", han: 6 },
        answer: { kind: "points", points: 12000 },
      },
      {
        key: "baiman",
        prompt: { kind: "tier", tierKey: "baiman", han: 8 },
        answer: { kind: "points", points: 16000 },
      },
    ]);
    expect(quiz.choices).toEqual(
      [8000, 12000, 16000, 24000, 32000].map((points) => ({
        kind: "points",
        points,
      })),
    );
  });

  it("子のツモ: 支払いの組（子ひとり / 親）を問い、選択肢は満貫〜役満の子のツモ", () => {
    const quiz = lessonQuiz("mangan-ko-tsumo");
    expect(quiz.questions.map((question) => question.answer)).toEqual([
      { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
      { kind: "koTsumo", fromKo: 3000, fromOya: 6000 },
      { kind: "koTsumo", fromKo: 4000, fromOya: 8000 },
    ]);
    expect(quiz.choices).toHaveLength(5);
  });

  it("親のロン: 子のロンの 1.5 倍の点数を問う", () => {
    const quiz = lessonQuiz("mangan-oya-ron");
    expect(quiz.questions.map((question) => question.answer)).toEqual(
      [12000, 18000, 24000].map((points) => ({ kind: "points", points })),
    );
  });

  it("親のツモ: 子ひとりが払う額（オール）を問う", () => {
    const quiz = lessonQuiz("mangan-oya-tsumo");
    expect(quiz.questions.map((question) => question.answer)).toEqual(
      [4000, 6000, 8000].map((all) => ({ kind: "oyaTsumo", all })),
    );
  });

  it("役: 門前・鳴きの翻数を問い、食い下がりは同じ役の門前と鳴きを続けて問う", () => {
    const quiz = lessonQuiz("yaku");
    expect(
      quiz.questions.map(({ prompt, answer }) => ({ prompt, answer })),
    ).toEqual([
      {
        prompt: { kind: "yaku", yaku: "立直", naki: false },
        answer: { kind: "han", han: 1 },
      },
      {
        prompt: { kind: "yaku", yaku: "対々和", naki: true },
        answer: { kind: "han", han: 2 },
      },
      {
        prompt: { kind: "yaku", yaku: "混一色", naki: false },
        answer: { kind: "han", han: 3 },
      },
      {
        prompt: { kind: "yaku", yaku: "混一色", naki: true },
        answer: { kind: "han", han: 2 },
      },
    ]);
    // 選択肢は一覧に現れる翻数すべてで、役満は翻数ではなく「役満」
    expect(quiz.choices).toEqual([
      { kind: "han", han: 1 },
      { kind: "han", han: 2 },
      { kind: "han", han: 3 },
      { kind: "han", han: 5 },
      { kind: "han", han: 6 },
      { kind: "yakuman" },
    ]);
  });

  it("雀頭の符: 東場・南家で三元牌・自風・オタ風・数牌の雀頭の符を問う", () => {
    const quiz = lessonQuiz("jantou-fu");
    expect(
      quiz.questions.map(({ prompt, answer }) => ({ prompt, answer })),
    ).toEqual(
      [
        [HaiKind.Haku, 2],
        [HaiKind.Nan, 2],
        [HaiKind.Sha, 0],
        [HaiKind.PinZu5, 0],
      ].map(([tile, fu]) => ({
        prompt: {
          kind: "jantou",
          tile,
          bakaze: HaiKind.Ton,
          jikaze: HaiKind.Nan,
        },
        answer: { kind: "fu", fu },
      })),
    );
    // 連風牌を 2 符で数えるので、雀頭に付く符は 0 符と 2 符だけ
    expect(quiz.choices).toEqual([
      { kind: "fu", fu: 0 },
      { kind: "fu", fu: 2 },
    ]);
  });

  it("面子の符: 明刻 → 暗刻 → 明槓 → 暗槓 と倍率を積み上げ、選択肢はまとめの表の符", () => {
    const quiz = lessonQuiz("mentsu-fu");
    expect(
      quiz.questions.map(({ prompt, answer }) =>
        prompt.kind === "mentsu"
          ? [prompt.mentsu.type, prompt.mentsu.furo !== undefined, answer]
          : undefined,
      ),
    ).toEqual([
      [MentsuType.Koutsu, true, { kind: "fu", fu: 2 }],
      [MentsuType.Koutsu, false, { kind: "fu", fu: 8 }],
      [MentsuType.Kantsu, true, { kind: "fu", fu: 8 }],
      [MentsuType.Kantsu, false, { kind: "fu", fu: 32 }],
    ]);
    expect(quiz.choices).toEqual(
      [0, 2, 4, 8, 16, 32].map((fu) => ({ kind: "fu", fu })),
    );
  });

  it("待ちの符: 両面・嵌張・辺張・双碰・単騎の待ち符を問い、選択肢は 0 符と 2 符", () => {
    const quiz = lessonQuiz("machi-fu");
    expect(quiz.questions.map(({ key, answer }) => [key, answer])).toEqual([
      ["ryanmen", { kind: "fu", fu: 0 }],
      ["kanchan", { kind: "fu", fu: 2 }],
      ["penchan", { kind: "fu", fu: 2 }],
      ["shanpon", { kind: "fu", fu: 0 }],
      ["tanki", { kind: "fu", fu: 2 }],
    ]);
    expect(quiz.choices).toEqual([
      { kind: "fu", fu: 0 },
      { kind: "fu", fu: 2 },
    ]);
  });

  it("手牌全体の符: 切り上げと、ツモ符・ロンの双碰・場風の間違えやすい所を問う", () => {
    const quiz = lessonQuiz("tehai-fu");
    expect(quiz.questions.map(({ key, answer }) => [key, answer])).toEqual([
      ["furoRon", { kind: "fu", fu: 30 }],
      ["furoTsumo", { kind: "fu", fu: 40 }],
      ["shanponRon", { kind: "fu", fu: 50 }],
      ["nanBakaze", { kind: "fu", fu: 40 }],
    ]);
    // 場風と自風は別（連風牌は設定で符が割れる）
    for (const { prompt } of quiz.questions) {
      expect(prompt.kind).toBe("tehai");
      if (prompt.kind === "tehai") {
        expect(prompt.context.bakaze).not.toBe(prompt.context.jikaze);
      }
    }
    // 20 符（平和ツモ）・25 符（七対子）は積み上げの外なので並べない
    expect(quiz.choices.map((choice) => choiceKey(choice))).toEqual(
      [30, 40, 50, 60, 70, 80, 90, 100, 110].map((fu) => `fu:${fu}`),
    );
  });

  it("手牌全体の符: 間違えやすい所を取り違えると、切り上げの段が変わる", () => {
    const [, furoTsumo, , nanBakaze] = lessonQuiz("tehai-fu").questions;
    const fuOf = (
      question: typeof furoTsumo,
      overrides: Partial<AgariContext>,
    ) =>
      question.prompt.kind === "tehai"
        ? calculateTotalFu(question.prompt.tehai, {
            ...question.prompt.context,
            ...overrides,
          })
        : undefined;
    // ツモ符を数えなければ（ロンと同じ）30 符
    expect(fuOf(furoTsumo, { isTsumo: false })).toBe(30);
    // 東を場風と取り違えれば南の雀頭は 0 符で 30 符
    expect(fuOf(nanBakaze, { bakaze: HaiKind.Ton })).toBe(30);
  });

  it("七対子: 役の組み合わせから翻数を足し、25 符のロンの点数を問う", () => {
    const quiz = lessonQuiz("chiitoitsu-score");
    expect(
      quiz.questions.map(({ prompt, answer }) => [prompt, answer]),
    ).toEqual([
      [
        { kind: "agari", role: "ko", winType: "ron", yaku: ["七対子"], han: 2 },
        { kind: "points", points: 1600 },
      ],
      [
        {
          kind: "agari",
          role: "ko",
          winType: "ron",
          yaku: ["七対子", "断么九"],
          han: 3,
        },
        { kind: "points", points: 3200 },
      ],
      [
        {
          kind: "agari",
          role: "ko",
          winType: "ron",
          yaku: ["七対子", "立直", "断么九"],
          han: 4,
        },
        { kind: "points", points: 6400 },
      ],
      [
        {
          kind: "agari",
          role: "oya",
          winType: "ron",
          yaku: ["七対子", "立直"],
          han: 3,
        },
        { kind: "points", points: 4800 },
      ],
    ]);
    // 子と親の 25 符・2〜4 翻のロン
    expect(quiz.choices).toEqual(
      [1600, 2400, 3200, 4800, 6400, 9600].map((points) => ({
        kind: "points",
        points,
      })),
    );
  });

  it("平和: ロンは 30 符・ツモは 20 符で子の表を引き、選択肢は子の表のツモ行とロン行", () => {
    const quiz = lessonQuiz("pinfu-score");
    expect(
      quiz.questions.map(({ key, prompt, answer }) => [
        key,
        prompt.kind === "agari" ? prompt.han : undefined,
        answer,
      ]),
    ).toEqual([
      ["ron", 1, { kind: "points", points: 1000 }],
      ["tsumo", 2, { kind: "koTsumo", fromKo: 400, fromOya: 700 }],
      ["tanyaoRon", 2, { kind: "points", points: 2000 }],
      ["tanyaoTsumo", 3, { kind: "koTsumo", fromKo: 700, fromOya: 1300 }],
    ]);
    expect(quiz.choices).toEqual([
      { kind: "koTsumo", fromKo: 400, fromOya: 700 },
      { kind: "koTsumo", fromKo: 700, fromOya: 1300 },
      { kind: "koTsumo", fromKo: 1300, fromOya: 2600 },
      { kind: "points", points: 1000 },
      { kind: "points", points: 2000 },
      { kind: "points", points: 3900 },
      { kind: "points", points: 7700 },
    ]);
  });

  it("門前の面子手: 積み上げた符をツモは切り捨て・ロンは切り上げて 30 符に足す", () => {
    const quiz = lessonQuiz("menzen-mentsu-score");
    expect(
      quiz.questions.map(({ prompt, answer }) => [
        prompt.kind === "extraFu"
          ? [prompt.handShape, prompt.winType, prompt.extraFu]
          : undefined,
        answer,
      ]),
    ).toEqual([
      [["menzen", "ron", 2], { kind: "fu", fu: 40 }],
      [["menzen", "tsumo", 8], { kind: "fu", fu: 30 }],
      [["menzen", "tsumo", 10], { kind: "fu", fu: 40 }],
      [["menzen", "ron", 12], { kind: "fu", fu: 50 }],
    ]);
    // 教本の対応表（積み上げ 2〜28 符）に現れる符
    expect(quiz.choices).toEqual(
      [30, 40, 50, 60].map((fu) => ({ kind: "fu", fu })),
    );
  });
});

import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import { generateJantouFuQuestion } from "./generator";
import { calculateJantouFu } from "../shared/jantou-fu";
import { seededRandom } from "../../test/seeded-random";
import { KAZEHAI } from "../../core/constants";

const ATTEMPTS = 200;

describe("generateJantouFuQuestion", () => {
  it("符の値が calculateJantouFu と一致する", () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const question = generateJantouFuQuestion();
      const { bakaze, jikaze } = question.context;

      for (const choice of question.choices) {
        expect(calculateJantouFu(choice.hai, bakaze, jikaze)).toBe(choice.fu);
      }
    }
  });

  it("renfonpaiAs4Fu=true でも calculateJantouFu と一致する", () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const question = generateJantouFuQuestion({ renfonpaiAs4Fu: true });
      const { bakaze, jikaze } = question.context;

      for (const choice of question.choices) {
        expect(calculateJantouFu(choice.hai, bakaze, jikaze, true)).toBe(
          choice.fu,
        );
      }
    }
  });

  it("正解は符が付き、不正解は0符である", () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const question = generateJantouFuQuestion();

      for (const choice of question.choices) {
        if (choice.isCorrect) {
          expect(choice.fu).toBeGreaterThan(0);
        } else {
          expect(choice.fu).toBe(0);
        }
      }
    }
  });

  it("正解は常に1つだけ、選択肢は4つ", () => {
    for (let i = 0; i < ATTEMPTS; i++) {
      const question = generateJantouFuQuestion();

      expect(question.choices).toHaveLength(4);
      expect(question.choices.filter((c) => c.isCorrect)).toHaveLength(1);
    }
  });

  it("連風牌の正解は renfonpaiAs4Fu=true のとき4符になる", () => {
    let tested = 0;
    for (let i = 0; i < ATTEMPTS * 5 && tested < 5; i++) {
      const question = generateJantouFuQuestion({ renfonpaiAs4Fu: true });
      const { bakaze, jikaze } = question.context;
      if (bakaze !== jikaze) continue;

      const correct = question.choices.find((c) => c.isCorrect);
      if (correct?.hai !== bakaze) continue;

      expect(correct.fu).toBe(4);
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });

  it("ID は注入した採番関数から取る", () => {
    const question = generateJantouFuQuestion({ idGen: () => "fixed-id" });

    expect(question.id).toBe("fixed-id");
  });
});

describe("選択肢の候補", () => {
  /** シードを変えて問題を並べる（乱数を注入するので結果は毎回同じ） */
  const questions = Array.from({ length: 400 }, (_, seed) =>
    generateJantouFuQuestion({ rng: seededRandom(seed), idGen: () => "id" }),
  );

  it("場風と自風が違う局面では、場風・自風のどちらも正解になりうる", () => {
    const correctWinds = new Set<string>();
    for (const { context, choices } of questions) {
      if (context.bakaze === context.jikaze) continue;
      const correct = choices.find((choice) => choice.isCorrect);
      if (correct?.hai === context.bakaze) correctWinds.add("bakaze");
      if (correct?.hai === context.jikaze) correctWinds.add("jikaze");
    }
    expect(correctWinds).toEqual(new Set(["bakaze", "jikaze"]));
  });

  it("不正解にはオタ風（場風でも自風でもない風）が出うる", () => {
    const otakaze = questions.some(({ context, choices }) =>
      choices.some(
        (choice) =>
          !choice.isCorrect &&
          KAZEHAI.some((kaze) => kaze === choice.hai) &&
          choice.hai !== context.bakaze &&
          choice.hai !== context.jikaze,
      ),
    );
    expect(otakaze).toBe(true);
  });

  it("不正解の数牌は萬子・筒子・索子の 1〜9 のどれもが出うる", () => {
    const numberTiles = new Set<number>();
    for (const { choices } of questions) {
      for (const choice of choices) {
        if (!choice.isCorrect && choice.hai <= HaiKind.SouZu9) {
          numberTiles.add(choice.hai);
        }
      }
    }
    expect(numberTiles.size).toBe(HaiKind.SouZu9 + 1);
  });
});

describe("RandomSource の注入", () => {
  it("同じシードなら同じ問題を生成する（決定論的）", () => {
    const build = () =>
      generateJantouFuQuestion({
        rng: seededRandom(42),
        idGen: () => "fixed-id",
      });

    expect(build()).toEqual(build());
  });

  it("シードが違えば違う問題が出る（供給源が実際に使われている）", () => {
    const build = (seed: number) =>
      generateJantouFuQuestion({
        rng: seededRandom(seed),
        idGen: () => "fixed-id",
      });

    const questions = Array.from({ length: 20 }, (_, i) => build(i));
    const shapes = new Set(questions.map((q) => JSON.stringify(q)));

    expect(shapes.size).toBeGreaterThan(1);
  });

  it("注入した供給源だけで選択肢まで決まる", () => {
    const question = generateJantouFuQuestion({
      rng: seededRandom(7),
      idGen: () => "fixed-id",
    });

    // 正解はちょうど1つ、選択肢は4つという不変条件を、
    // 固定した問題そのものに対して確かめられる。
    expect(question.choices).toHaveLength(4);
    expect(question.choices.filter((c) => c.isCorrect)).toHaveLength(1);
    expect(
      generateJantouFuQuestion({
        rng: seededRandom(7),
        idGen: () => "fixed-id",
      }).choices,
    ).toEqual(question.choices);
  });
});

import { describe, expect, it } from "vitest";

import { generateJantouFuQuestion } from "./generator";
import { calculateJantouFu } from "../shared/jantou-fu";
import { seededRandom } from "../../test/seeded-random";

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

import { describe, it, expect } from "vitest";
import { generateTotalFuQuestion } from "./generator";
import {
  expectGeneratesEventually,
  expectSampled,
  generateOne,
} from "../../test/sampling";

/** 符として取りうる値（ライブラリの `Fu` 型と同じ） */
const VALID_FU = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

describe("generateTotalFuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateTotalFuQuestion);
  });

  it("正解は符として取りうる値になる", () => {
    const questions = expectSampled(generateTotalFuQuestion, {
      attempts: 500,
      need: 200,
    });

    for (const q of questions) {
      expect(VALID_FU).toContain(q.answer);
    }
  });

  it("内訳の合計を10符単位に切り上げると正解になる", () => {
    // 内訳（切り上げ前）と正解（切り上げ後）が食い違うと、
    // フィードバックの説明が答えを説明できなくなる。
    // 平和ツモ（内訳20符・正解20符）と七対子（内訳25符・正解25符）は
    // 切り上げの対象外なので、そのまま一致する。
    const questions = expectSampled(generateTotalFuQuestion, {
      attempts: 500,
      need: 200,
    });

    for (const q of questions) {
      const rawSum = q.fuDetails.reduce((sum, d) => sum + d.fu, 0);
      const expected =
        q.answer === 20 || q.answer === 25
          ? q.answer
          : Math.ceil(rawSum / 10) * 10;

      expect(expected, `内訳 ${rawSum}符 に対し正解 ${q.answer}符`).toBe(
        q.answer,
      );
    }
  });

  it("七対子は25符になる", () => {
    const questions = expectSampled(generateTotalFuQuestion, {
      attempts: 2000,
      need: 5,
      where: (q) => q.fuDetails.some((d) => d.reason === "七対子"),
    });

    for (const q of questions) {
      expect(q.answer).toBe(25);
    }
  });

  it("副露のみで構成された手でも待ち符・和了符の扱いが破綻しない", () => {
    // 門前ロンの10符は門前手のみ。副露手のロンで加算されていないことを確かめる。
    const questions = expectSampled(generateTotalFuQuestion, {
      attempts: 2000,
      need: 5,
      where: (q) => q.tehai.exposed.length > 0 && !q.context.isTsumo,
    });

    for (const q of questions) {
      const hasMenzenBonus = q.fuDetails.some((d) => d.reason === "門前加符");
      const hasAnkan = q.tehai.exposed.some((m) => !m.furo);

      // 暗槓のみの手は門前が保たれるため除外する
      if (!hasAnkan) {
        expect(hasMenzenBonus).toBe(false);
      }
    }
  });

  it("ID は注入した採番関数から取る", () => {
    let seq = 0;
    const question = generateOne(() =>
      generateTotalFuQuestion({ idGen: () => `id-${seq++}` }),
    );

    expect(question.id).toMatch(/^id-\d+$/);
  });

  it("連風牌の雀頭は renfonpaiAs4Fu で4符になる", () => {
    // ルール設定がライブラリまで届いているかの確認。
    // 連風牌（場風かつ自風）の雀頭を持つ問題だけを集めて比較する。
    const questions = expectSampled(
      () => generateTotalFuQuestion({ renfonpaiAs4Fu: true }),
      {
        attempts: 5000,
        need: 3,
        where: (q) =>
          q.fuDetails.some((d) => d.reason.startsWith("雀頭(") && d.fu === 4),
      },
    );

    expect(questions.length).toBeGreaterThan(0);
  });
});

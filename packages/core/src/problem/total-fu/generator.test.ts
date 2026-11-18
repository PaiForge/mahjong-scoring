import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import {
  calculateTotalFu,
  generateTotalFuQuestion,
  generateTotalFuQuestionInRange,
} from "./generator";
import { agariTehai } from "../../test/tehai";
import { totalFuChoices } from "./range";
import { mulberry32 } from "../../core/random";
import { KAZEHAI } from "../../core/constants";
import { seededRandom } from "../../test/seeded-random";
import type { TotalFuQuestion } from "./types";

/** 連風牌（場風かつ自風）の雀頭の内訳の表示 */
const RENFONPAI_JANTOU = "雀頭(場風・自風)";
import {
  CHIITOITSU_FU,
  FU_VALUES,
  PINFU_RON_FU,
  PINFU_TSUMO_FU,
} from "../../score/constants";
import {
  expectGeneratesEventually,
  expectSampled,
  generateOne,
} from "../../test/sampling";

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
      expect(FU_VALUES).toContain(q.answer);
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

  it("excludeRenfonpai で場風＝自風の局面を出題しない", () => {
    // 連風牌が成立しない局面だけを出すことで、合計符が連風牌ルール
    // （2符/4符）に左右されなくなる。昇級試験が依存する不変条件。
    const questions = expectSampled(
      () => generateTotalFuQuestion({ excludeRenfonpai: true }),
      { attempts: 500, need: 200 },
    );

    for (const q of questions) {
      expect(q.context.jikaze).not.toBe(q.context.bakaze);
    }
  });

  it("既定では場風＝自風の局面も出題する", () => {
    expectSampled(generateTotalFuQuestion, {
      attempts: 2000,
      need: 1,
      where: (q) => q.context.jikaze === q.context.bakaze,
    });
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

describe("generateTotalFuQuestion（乱数を固定した出題）", () => {
  /** シードを固定して条件に合う問題を集める（結果は実行ごとに変わらない） */
  function sampleSeeded(
    options: Parameters<typeof generateTotalFuQuestion>[0],
    sampling: Parameters<typeof expectSampled<TotalFuQuestion>>[1],
  ) {
    const rng = seededRandom(20261119);
    return expectSampled(
      () => generateTotalFuQuestion({ ...options, rng }),
      sampling,
    );
  }

  it("役の無い手は出題しない", () => {
    const questions = sampleSeeded({}, { attempts: 300, need: 200 });

    for (const q of questions) {
      expect(calculateTotalFu(q.tehai, q.context)).toBe(q.answer);
    }
  });

  it("excludeRenfonpai でも自風は東南西北のどれかで、場風とは違う風になる", () => {
    const questions = sampleSeeded(
      { excludeRenfonpai: true },
      { attempts: 300, need: 200 },
    );

    for (const q of questions) {
      expect(KAZEHAI).toContain(q.context.jikaze);
      expect(q.context.jikaze).not.toBe(q.context.bakaze);
    }
  });

  it("既定では連風牌の雀頭は2符", () => {
    const questions = sampleSeeded(
      {},
      {
        attempts: 5000,
        need: 1,
        where: (q) => q.fuDetails.some((d) => d.reason === RENFONPAI_JANTOU),
      },
    );

    for (const q of questions) {
      const jantou = q.fuDetails.find((d) => d.reason === RENFONPAI_JANTOU);
      expect(jantou?.fu).toBe(2);
    }
  });

  it("鳴いた面子（チー・ポン・明槓）を含む手も出題する", () => {
    // 暗槓も副露の側に並ぶので、exposed の有無ではなく鳴いた印（furo）で見る
    sampleSeeded(
      {},
      {
        attempts: 300,
        need: 1,
        where: (q) => q.tehai.exposed.some((mentsu) => !!mentsu.furo),
      },
    );
  });

  it("fuBand の下限・上限ちょうどの符は出題する", () => {
    const questions = sampleSeeded(
      { fuBand: { min: 30, max: 30 } },
      { attempts: 300, need: 5 },
    );

    for (const q of questions) {
      expect(q.answer).toBe(30);
    }
  });
});

describe("generateTotalFuQuestionInRange", () => {
  it("fuBand の外の符は出題しない", () => {
    const questions = expectSampled(
      () => generateTotalFuQuestion({ fuBand: { min: 50, max: 60 } }),
      { attempts: 2000, need: 50 },
    );

    for (const q of questions) {
      expect([50, 60]).toContain(q.answer);
    }
  });

  it.each(["up-to-40", "up-to-60", "all"] as const)(
    "%s の正解は選択肢（totalFuChoices）に収まる",
    (range) => {
      const choices = totalFuChoices(range);
      const questions = expectSampled(
        () => generateTotalFuQuestionInRange(range),
        { attempts: 300, need: 300 },
      );

      expect(questions).toHaveLength(300);
      for (const q of questions) {
        expect(choices).toContain(q.answer);
      }
    },
  );

  it("up-to-60 は問題の半分前後を 50・60符から出す", () => {
    // 範囲外を捨てるだけだと 50・60符は 2 割弱にとどまる。帯を 1 問ごとに
    // 固定して選んでいることの確認（リトライのたびに選び直すと低い帯に寄る）
    const rng = mulberry32(1);
    const questions = expectSampled(
      () => generateTotalFuQuestionInRange("up-to-60", { rng }),
      { attempts: 1000, need: 1000 },
    );
    const high = questions.filter((q) => q.answer >= 50).length;

    expect(high / questions.length).toBeGreaterThan(0.4);
    expect(high / questions.length).toBeLessThan(0.6);
  });

  it("up-to-40 の選択肢は 20・25・30・40符", () => {
    expect(totalFuChoices("up-to-40")).toEqual([20, 25, 30, 40]);
    expect(totalFuChoices("up-to-60")).toEqual([20, 25, 30, 40, 50, 60]);
    expect(totalFuChoices("all")).toEqual(FU_VALUES);
  });
});

describe("calculateTotalFu", () => {
  const kaze = { bakaze: HaiKind.Ton, jikaze: HaiKind.Nan };

  it("七対子はツモでもロンでも固定の符", () => {
    const tehai = agariTehai("1122m3344p5566s77z");
    for (const isTsumo of [true, false]) {
      expect(
        calculateTotalFu(tehai, { ...kaze, agariHai: HaiKind.Chun, isTsumo }),
      ).toBe(CHIITOITSU_FU);
    }
  });

  it("平和はツモなら副底のまま、ロンなら門前ロンの加符が乗る", () => {
    const tehai = agariTehai("234m567m345p678s22s");
    const context = { ...kaze, agariHai: HaiKind.ManZu2 };
    expect(calculateTotalFu(tehai, { ...context, isTsumo: true })).toBe(
      PINFU_TSUMO_FU,
    );
    expect(calculateTotalFu(tehai, { ...context, isTsumo: false })).toBe(
      PINFU_RON_FU,
    );
  });

  it("連風牌の雀頭は既定で2符、renfonpaiAs4Fu で4符", () => {
    // 白の暗刻（役牌）で役を付けた門前ロン。副底20 + 門前加符10 + 白の暗刻8 +
    // 東の雀頭（東場の東家）で、雀頭が2符なら40符、4符なら42符を切り上げて50符
    const tehai = agariTehai("234m567p678s555z11z");
    const context = {
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Ton,
      agariHai: HaiKind.ManZu2,
      isTsumo: false,
    };
    expect(calculateTotalFu(tehai, context)).toBe(40);
    expect(calculateTotalFu(tehai, context, true)).toBe(50);
  });

  it("役が無い手は undefined", () => {
    const tehai = agariTehai("123m456m789p123s11z");
    expect(
      calculateTotalFu(tehai, {
        ...kaze,
        agariHai: HaiKind.ManZu1,
        isTsumo: false,
      }),
    ).toBeUndefined();
  });
});

import { describe, it, expect } from "vitest";
import {
  HaiKind,
  detectYaku,
  getYakumanMultiplier,
  isMenzen,
} from "@pai-forge/riichi-mahjong";
import { generateScoreQuestion, generateValidScoreQuestion } from "./generator";
import { countKantsu } from "../shared/count-kantsu";
import { listTehaiHais } from "../../core/hai-count";
import { expectHaiUsageWithinLimit } from "../../test/tile-usage";
import { SCORE_FILTERABLE_YAKU } from "./filterable-yaku";
import { ScoreLevel } from "../../core/constants";
import { isMangan, MANGAN_MIN_HAN, MANGAN_PLUS_TIERS } from "../../score/tiers";
import { isKiriageManganTarget } from "../../score/calculator";
import { ALL_YAKUMAN_RULES_ENABLED } from "../../rules/settings";
import {
  expectGeneratesEventually,
  expectSampled,
  sample,
} from "../../test/sampling";
import { seededRandom } from "../../test/seeded-random";

/** ダブル役満の区分に入る最小翻数（丸めの検証で狙い撃つ翻数） */
const DOUBLE_YAKUMAN_MIN_HAN = (() => {
  const tier = MANGAN_PLUS_TIERS.find((t) => t.key === "doubleYakuman");
  if (!tier) throw new Error("MANGAN_PLUS_TIERS にダブル役満の区分がない");
  return tier.minHan;
})();

describe("generateScoreQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateScoreQuestion);
  });

  it("生成された問題が正しい構造を持つ", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.tehai).toBeDefined();
    expect(question.tehai.closed).toBeDefined();
    expect(question.tehai.exposed).toBeDefined();
    expect(typeof question.agariHai).toBe("number");
    expect(question.agariHai).toBeGreaterThanOrEqual(0);
    expect(question.agariHai).toBeLessThanOrEqual(33);
    expect(typeof question.isTsumo).toBe("boolean");
    expect(typeof question.jikaze).toBe("number");
    expect(typeof question.bakaze).toBe("number");
    expect(Array.isArray(question.doraMarkers)).toBe(true);
    expect(question.doraMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it("answer に有効な翻数・符・支払い情報が含まれる", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.answer.han).toBeGreaterThanOrEqual(1);
    expect(question.answer.fu).toBeGreaterThanOrEqual(20);
    expect(question.answer.scoreLevel).toBeDefined();
    expect(question.answer.payment).toBeDefined();
    expect(["ron", "oyaTsumo", "koTsumo"]).toContain(
      question.answer.payment.type,
    );
  });

  it("yakuDetails が定義されている場合、少なくとも1つの役がある", () => {
    const questions = expectSampled(generateScoreQuestion, {
      attempts: 200,
      where: (q) => q.yakuDetails !== undefined,
    });

    for (const question of questions) {
      expect(question.yakuDetails!.length).toBeGreaterThan(0);
      for (const yaku of question.yakuDetails!) {
        expect(yaku.name).toBeTruthy();
        expect(yaku.han).toBeGreaterThanOrEqual(1);
      }
    }
  });

  describe("オプション: includeParent / includeChild", () => {
    it("includeParent=false の場合、自風が東にならない", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: false, includeChild: true }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).not.toBe(HaiKind.Ton);
      }
    });

    it("includeChild=false の場合、自風が東になる", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: true, includeChild: false }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).toBe(HaiKind.Ton);
      }
    });
  });

  describe("オプション: excludeRenfonpai", () => {
    it("true の場合、場風と自風が一致する局面を出題しない", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ excludeRenfonpai: true }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(question.bakaze).not.toBe(question.jikaze);
      }
    });

    it("親（自風＝東）の出題を残す（場風を落として自風は落とさない）", () => {
      // 自風の側を落とす向きだと親が出るのは南場だけになり、親の点数表を
      // 引く問題が細る。生成器はその逆向きで連風牌を避ける
      const questions = expectSampled(
        () => generateScoreQuestion({ excludeRenfonpai: true }),
        { attempts: 600, need: 20 },
      );

      expect(
        questions.some((question) => question.jikaze === HaiKind.Ton),
      ).toBe(true);
    });
  });

  describe("役満ルール既定（ダブル役満なし）", () => {
    it("正解の点数区分がダブル役満にならない", () => {
      // yakumanRules を渡さない既定ではダブル役満・複合の合算を採用しない。
      // 64000 のようにどの点数リスト（RON_SCORES_KO 等）にも無い点数が
      // 正解になり、選択肢から選べない問題が出ないことの保証
      const questions = expectSampled(() => generateScoreQuestion(), {
        attempts: 2000,
        need: 500,
      });

      for (const question of questions) {
        expect(question.answer.scoreLevel).not.toBe(ScoreLevel.DoubleYakuman);
      }
    });
  });

  describe("オプション: yakumanRules", () => {
    it("全ルール有効なら26翻以上の手はダブル役満の支払いになる", () => {
      const rng = seededRandom(20260902);
      const [question] = expectSampled(
        () =>
          generateScoreQuestion({
            rng,
            yakumanRules: ALL_YAKUMAN_RULES_ENABLED,
          }),
        {
          attempts: 40000,
          need: 1,
          where: (candidate) => candidate.answer.han >= DOUBLE_YAKUMAN_MIN_HAN,
        },
      );

      expect(question.answer.scoreLevel).toBe(ScoreLevel.DoubleYakuman);
      expect(question.answer.yakumanMultiplier).toBe(2);
    });

    it("トリプル役満以上（役満3個分〜）は出題しない", () => {
      // 点数選択肢のリストはダブル役満まで。ランダム生成では実質出ない手
      // だが、生成器の防波堤が機能していることをサンプリングで確かめる
      const questions = expectSampled(
        () =>
          generateScoreQuestion({
            yakumanRules: ALL_YAKUMAN_RULES_ENABLED,
          }),
        { attempts: 2000, need: 500 },
      );

      for (const question of questions) {
        expect(question.answer.yakumanMultiplier).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("オプション: excludeYakumanRuleBoundary", () => {
    it("true の場合、役満ルールの採否で点数が割れる手を出題しない", () => {
      // 「全ルール有効なら26翻以上」テストと同じシードを使う。あちらで
      // ダブル役満になる手が同じ列から出ることが分かっているので、境界除外が
      // その手を落とすことを同条件で確かめられる
      const rng = seededRandom(20260902);
      const questions = expectSampled(
        () =>
          generateScoreQuestion({
            rng,
            excludeYakumanRuleBoundary: true,
          }),
        { attempts: 40000, need: 500 },
      );

      for (const question of questions) {
        // 境界の定義どおりに検証する: 全ルール有効として数え直したとき
        // 役満2個分以上になる手（= ルールの採否で点数が割れる手）が
        // 出題に残っていないこと
        const allOnResult = detectYaku(question.tehai, {
          agariHai: question.agariHai,
          bakaze: question.bakaze,
          jikaze: question.jikaze,
          doraMarkers: question.doraMarkers,
          isTsumo: question.isTsumo,
          ruleConfig: ALL_YAKUMAN_RULES_ENABLED,
        });
        expect(
          getYakumanMultiplier(allOnResult, ALL_YAKUMAN_RULES_ENABLED),
        ).toBeLessThan(2);
      }
    });
  });

  describe("オプション: excludeKiriageBoundary", () => {
    it("true の場合、切り上げ満貫で点数が割れる手を出題しない", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ excludeKiriageBoundary: true }),
        { attempts: 2000, need: 300 },
      );

      for (const question of questions) {
        expect(isKiriageManganTarget(question.answer)).toBe(false);
      }
    });

    it("既定（false）では切り上げ満貫の境界の手も出題される", () => {
      // 除外オプションが「もともと出ないものを外している」だけでないことの対照。
      // 30符4翻・60符3翻はプールの約 1% なので試行を多めに取る
      const boundary = sample(() => generateScoreQuestion(), {
        attempts: 4000,
        need: 1,
        where: (question) => isKiriageManganTarget(question.answer),
      });

      expect(boundary.length).toBe(1);
    });
  });

  describe("オプション: allowedRanges", () => {
    it("nonMangan のみの場合、通常点数の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["nonMangan"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(question.answer.scoreLevel).toBe(ScoreLevel.Normal);
      }
    });

    it("manganPlus のみの場合、満貫以上の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["manganPlus"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(isMangan(question.answer.scoreLevel)).toBe(true);
      }
    });
  });

  describe("オプション: minHan", () => {
    it("minHan 以上の翻数の問題のみ生成される", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({
            allowedRanges: ["manganPlus"],
            minHan: MANGAN_MIN_HAN,
          }),
        { attempts: 1000, need: 5 },
      );

      for (const question of questions) {
        expect(question.answer.han).toBeGreaterThanOrEqual(MANGAN_MIN_HAN);
      }
    });

    it("minHan 未指定の場合、manganPlus には符由来の満貫（4翻以下）も含まれる", () => {
      // minHan が存在する理由の裏付け: 絞らなければ 4翻以下の満貫が出題される
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["manganPlus"] }),
        {
          attempts: 3000,
          need: 1,
          where: (q) => q.answer.han < MANGAN_MIN_HAN,
        },
      );

      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("オプション: allowedFu", () => {
    it("指定した符の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedFu: [20, 30] }),
        { attempts: 3000, need: 5 },
      );

      for (const question of questions) {
        expect([20, 30]).toContain(question.answer.fu);
      }
    });
  });
});

describe("風牌の役牌", () => {
  // ライブラリ（0.8.0〜）が場風・自風を役として返すので、アプリ側で手牌を
  // 数えて補完しない。補完が残っていると同じ役牌を二重に数え、内訳に
  // 「場風牌」が2回並ぶ。役牌の刻子は生成される手の数%にしか無いため試行を
  // 多めに取る
  it("場風牌は内訳にちょうど1回だけ現れ、翻数と一致する", () => {
    const questions = expectSampled(
      () => generateScoreQuestion({ requiredYaku: ["場風牌"] }),
      { attempts: 4000, need: 20 },
    );

    for (const question of questions) {
      const details = question.yakuDetails ?? [];
      expect(details.filter((yaku) => yaku.name === "場風牌")).toEqual([
        { name: "場風牌", han: 1 },
      ]);
      const sum = details.reduce((total, yaku) => total + yaku.han, 0);
      expect(sum).toBe(question.answer.han);
    }
  });

  it("連風牌（場風＝自風）の刻子は場風牌と自風牌が1回ずつ現れる", () => {
    const questions = expectSampled(
      () => generateScoreQuestion({ requiredYaku: ["場風牌"] }),
      {
        attempts: 8000,
        need: 5,
        where: (q) => q.bakaze === q.jikaze,
      },
    );

    for (const question of questions) {
      const names = (question.yakuDetails ?? []).map((yaku) => yaku.name);
      expect(names.filter((name) => name === "場風牌")).toHaveLength(1);
      expect(names.filter((name) => name === "自風牌")).toHaveLength(1);
    }
  });
});

describe("generateValidScoreQuestion", () => {
  it("デフォルトオプションで有効な問題を生成する", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
  });

  it("maxRetries=1 でも生成を試みる", () => {
    // 1回で生成できない場合もあるが、undefined か ScoreQuestion のいずれかを返す
    const question = generateValidScoreQuestion({}, 1);
    // 型チェックのみ（undefined or ScoreQuestion）
    expect(question === undefined || typeof question === "object").toBe(true);
  });

  it("リーチフラグが true の問題は必ず立直の翻と裏ドラ表示牌を持つ", () => {
    // 出題（isRiichi の表示）と正解（yakuDetails・点数）が食い違わないこと。
    // リーチの抽選が generator の1箇所に閉じている限り、例外は無い。
    const riichiQuestions = expectSampled(generateValidScoreQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => q.isRiichi === true,
    });

    for (const question of riichiQuestions) {
      expect(
        question.yakuDetails?.some(
          (y) => y.name === "立直" || y.name === "ダブル立直",
        ),
      ).toBe(true);
      expect(question.uraDoraMarkers).toBeDefined();
      // 裏ドラは表ドラの下に伏せてある牌なので、槓で表が増えれば裏も増える
      expect(question.uraDoraMarkers).toHaveLength(question.doraMarkers.length);
    }
  });

  it("手牌とドラ表示牌を合わせても同じ牌が5枚にならない", () => {
    // 表示牌も山から取る 1 枚。手牌で使い切った牌種が表示牌にも出ると、
    // その牌が 5 枚要る盤面になる（実物の麻雀では起こり得ない）。
    const questions = expectSampled(generateValidScoreQuestion, {
      need: 200,
      attempts: 400,
    });

    for (const question of questions) {
      expectHaiUsageWithinLimit(
        [
          ...listTehaiHais(question.tehai),
          ...question.doraMarkers,
          ...(question.uraDoraMarkers ?? []),
        ],
        "点数計算の出題",
      );
    }
  });

  it("槓子のある問題はその数だけドラ表示牌が増える", () => {
    // カン 1 回につき新ドラが 1 枚めくられる（表示牌は 1 + 槓子数）。
    // 暗槓は門前のままなので、リーチが乗れば裏ドラも同じ枚数になる。
    const kantsuQuestions = expectSampled(generateValidScoreQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => countKantsu(q.tehai) > 0,
    });

    for (const question of kantsuQuestions) {
      expect(question.doraMarkers).toHaveLength(
        1 + countKantsu(question.tehai),
      );
    }

    // 槓が無ければ 1 枚だけ
    const noKantsu = expectSampled(generateValidScoreQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => countKantsu(q.tehai) === 0,
    });

    for (const question of noKantsu) {
      expect(question.doraMarkers).toHaveLength(1);
    }
  });

  it("ドラ表示牌は有効な HaiKindId（0-33）である", () => {
    const questions = expectSampled(generateValidScoreQuestion);

    for (const question of questions) {
      for (const marker of question.doraMarkers) {
        expect(marker).toBeGreaterThanOrEqual(0);
        expect(marker).toBeLessThanOrEqual(33);
      }
    }
  });
});

describe("オプション: requireFuro", () => {
  it("副露している手だけが生成される", () => {
    for (let i = 0; i < 50; i++) {
      const question = generateValidScoreQuestion({ requireFuro: true }, 500);
      expect(question).toBeDefined();
      expect(isMenzen(question!.tehai)).toBe(false);
    }
  });

  it("既定では門前手も生成される", () => {
    const questions = Array.from({ length: 200 }, () =>
      generateValidScoreQuestion({}, 500),
    );
    expect(questions.some((q) => q !== undefined && isMenzen(q.tehai))).toBe(
      true,
    );
  });
});

describe("オプション: requiredYaku", () => {
  it("指定した役が成立する問題のみ生成される", () => {
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: ["平和"] },
        500,
      );
      expect(question).toBeDefined();
      const names = (question?.yakuDetails ?? []).map((yaku) => yaku.name);
      expect(names).toContain("平和");
    }
  });

  it("複数指定は OR で解釈される（いずれかが成立していれば通る）", () => {
    const targets = ["平和", "対々和"] as const;
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: [...targets] },
        500,
      );
      expect(question).toBeDefined();
      const names = new Set(
        (question?.yakuDetails ?? []).map((yaku) => yaku.name),
      );
      expect(targets.some((target) => names.has(target))).toBe(true);
    }
  });

  it("七対子は includeChiitoi 無しでも requiredYaku だけで出せる", () => {
    // 七対子は既定の生成対象外（面子手しか作らない）。名指しされたときだけ
    // 生成経路が開く、という generator.ts の分岐がここで固定される。
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: ["七対子"] },
        500,
      );
      expect(question).toBeDefined();
      const names = (question?.yakuDetails ?? []).map((yaku) => yaku.name);
      expect(names).toContain("七対子");
    }
  });

  it("成立し得ない役名を指定すると生成に失敗する", () => {
    const question = generateValidScoreQuestion(
      { requiredYaku: ["存在しない役"] },
      50,
    );
    expect(question).toBeUndefined();
  });

  it("空配列は「絞り込まない」として扱う", () => {
    const question = generateValidScoreQuestion({ requiredYaku: [] });
    expect(question).toBeDefined();
  });

  it("SCORE_FILTERABLE_YAKU のすべての役はリトライ500回以内に生成できる", () => {
    // allowlist の収録基準（既定条件で出現率2%以上）の実効性を担保する。
    // 生成器の分布を変えてこのテストが落ちた場合は filterable-yaku.ts の
    // 実測を取り直して収録役を見直すこと。
    for (const yaku of SCORE_FILTERABLE_YAKU) {
      const question = generateValidScoreQuestion(
        { requiredYaku: [yaku] },
        500,
      );
      expect(question, `役「${yaku}」の問題を生成できない`).toBeDefined();
    }
  });
});

describe("RandomSource の注入", () => {
  /** 生成に成功する最小のシードを探す（生成器は条件次第で undefined を返す） */
  function firstSuccessfulSeed(): number {
    for (let seed = 0; seed < 500; seed++) {
      if (generateScoreQuestion({ rng: seededRandom(seed) })) return seed;
    }
    throw new Error("固定シードで1問も生成できない");
  }

  it("同じシードなら手牌・和了状況・正解まで同一の問題を生成する", () => {
    const seed = firstSuccessfulSeed();

    const first = generateScoreQuestion({ rng: seededRandom(seed) });
    const second = generateScoreQuestion({ rng: seededRandom(seed) });

    expect(first).toBeDefined();
    expect(second).toEqual(first);
  });

  it("生成に失敗するシードでも同じシードなら同じく失敗する", () => {
    const seed = 1234;
    const first = generateScoreQuestion({ rng: seededRandom(seed) });
    const second = generateScoreQuestion({ rng: seededRandom(seed) });

    expect(second).toEqual(first);
  });

  it("シードが違えば違う手牌が出る（供給源が生成経路の隅まで届いている）", () => {
    const hands = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const question = generateScoreQuestion({ rng: seededRandom(seed) });
      if (question) hands.add(JSON.stringify(question.tehai));
    }

    expect(hands.size).toBeGreaterThan(1);
  });
});

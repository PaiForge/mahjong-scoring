import { describe, it, expect } from "vitest";
import {
  HaiKind,
  calculateScoreForTehai,
  calculateShanten,
  countDora,
  getUkeire,
  isMenzen,
  sortHaiCodes,
  validateTehai14,
} from "@pai-forge/riichi-mahjong";
import {
  fitsAnswerOptions,
  generateTenpaiScoreQuestion,
  generateValidTenpaiScoreQuestion,
  hasKaraWait,
} from "./generator";
import { finalizeTehai13 } from "../shared/hand-skeleton";
import type { TenpaiScoreQuestion } from "./types";
import { buildScoreQuestion } from "../score/build-question";
import { parseTehai } from "../score/mpsz-serializer";
import type { ScoreQuestion } from "../score/types";
import { countKantsu } from "../shared/count-kantsu";
import { listTehaiHais } from "../../core/hai-count";
import { ScoreLevel } from "../../core/constants";
import { expectHaiUsageWithinLimit } from "../../test/tile-usage";
import {
  expectGeneratesEventually,
  expectSampled,
  generateOne,
  sample,
} from "../../test/sampling";
import { seededRandom } from "../../test/seeded-random";

/** 1 問の中の点数計算問題（ツモ・ロン、役なしのロンは除く）を平らに並べる */
function listCells(question: TenpaiScoreQuestion) {
  return question.waits.flatMap((wait) =>
    wait.ron ? [wait.tsumo, wait.ron] : [wait.tsumo],
  );
}

/**
 * リーチ無しの出題の答えを、ライブラリの素の計算と突き合わせる
 *
 * 役満の手だけは翻をそのまま比べない。ライブラリは役満の手でも翻にドラを
 * 足して返す（支払いは役満単位で固定なので点数には効かない）が、アプリは
 * 役満を通常役・ドラと複合させず、翻を役満の翻そのものに揃える
 * （`buildScoreQuestion`）。そのまま比べるとドラの乗った役満で
 * 「13 翻と 16 翻」のように食い違う
 */
function expectMatchesLibraryScore(cell: ScoreQuestion) {
  const recomputed = calculateScoreForTehai(cell.tehai, {
    agariHai: cell.agariHai,
    isTsumo: cell.isTsumo,
    jikaze: cell.jikaze,
    bakaze: cell.bakaze,
    doraMarkers: cell.doraMarkers,
  });
  expect(recomputed.isOk()).toBe(true);
  if (!recomputed.isOk()) return;
  const { han, fu, payment, yakumanMultiplier } = recomputed.value;
  const expectedHan =
    yakumanMultiplier >= 1
      ? han - countDora(cell.tehai, cell.doraMarkers)
      : han;
  expect(cell.answer.han).toBe(expectedHan);
  expect(cell.answer.fu).toBe(fu);
  expect(cell.answer.payment).toEqual(payment);
}

describe("generateTenpaiScoreQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateTenpaiScoreQuestion);
  });

  it("聴牌形は面子手として聴牌している", () => {
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      const shanten = calculateShanten(question.tehai, false, false);
      expect(shanten.isOk() && shanten.value).toBe(0);
    }
  });

  it("待ちは 2 つ以上あり、牌種 ID の昇順で、聴牌形の受け入れと一致する", () => {
    // 待ち当ての正解は「聴牌形に足すと和了形になる牌」のすべて。出題側が
    // 独自に持つと、和了牌として選んだ 1 枚だけを正解にしてしまう
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      const waits = question.waits.map((wait) => wait.agariHai);
      expect(waits.length).toBeGreaterThanOrEqual(2);
      expect(waits).toEqual(sortHaiCodes(waits));
      expect(waits).toEqual(getUkeire(question.tehai));
    }
  });

  it("各待ちの出題は聴牌形に待ち牌を 1 枚足した和了形で、独立に計算し直した点数と一致する", () => {
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      for (const wait of question.waits) {
        for (const cell of [wait.tsumo, wait.ron]) {
          if (!cell) continue;
          expect(cell.agariHai).toBe(wait.agariHai);
          expect(cell.jikaze).toBe(question.jikaze);
          expect(cell.bakaze).toBe(question.bakaze);
          expect(cell.doraMarkers).toEqual(question.doraMarkers);
          expect(sortHaiCodes(cell.tehai.closed)).toEqual(
            sortHaiCodes([...question.tehai.closed, wait.agariHai]),
          );
          expect(cell.tehai.exposed).toEqual(question.tehai.exposed);

          // リーチ無しの出題は、ライブラリの素の計算と翻・符・支払いが一致する
          if (!question.isRiichi) expectMatchesLibraryScore(cell);
        }
        expect(wait.tsumo.isTsumo).toBe(true);
        if (wait.ron) expect(wait.ron.isTsumo).toBe(false);
      }
    }
  });

  it("ドラの乗った役満も、ライブラリの素の計算と点数が一致する", () => {
    // 乱数で稀に引く形の固定（2026-10 に上のテストが「13 翻と 16 翻」で落ちた）。
    // 111m 66m 888p 999p 44z の双碰待ちで 6m をツモると四暗刻。ドラ表示牌が
    // 7p なので 8p がドラ 3 枚で、ライブラリの翻は 16 になる
    const parsed = parseTehai("111666m888999p44z");
    if (parsed === undefined) throw new Error("MPSZ を読めない");
    const tehai = validateTehai14(parsed)._unsafeUnwrap();
    const cell = buildScoreQuestion({
      tehai,
      agariHai: HaiKind.ManZu6,
      isTsumo: true,
      jikaze: HaiKind.Ton,
      bakaze: HaiKind.Nan,
      doraMarkers: [HaiKind.PinZu7],
      ruleConfig: {},
    })._unsafeUnwrap();
    expect(cell.answer.yakumanMultiplier).toBe(1);
    expect(cell.answer.han).toBe(13);
    expectMatchesLibraryScore(cell);
  });

  it("翻数は役の内訳の合計と一致する", () => {
    // 結果表示は役の内訳を出すため、ここがずれると画面で見えてしまう
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const cell of questions.flatMap(listCells)) {
      const total = (cell.yakuDetails ?? []).reduce(
        (sum, yaku) => sum + yaku.han,
        0,
      );
      expect(cell.answer.han).toBe(total);
    }
  });

  it("副露手の役なしのロン待ちは、ツモなら三暗刻が付く待ちに限る", () => {
    // 副露手でツモも役なしになる待ちは「待ち牌」として答えさせる意味が無いため
    // 聴牌形ごと出題しない。副露手でロンだけ役なしになるのは、暗刻 2 つと
    // 双碰待ちの形でツモなら 3 つ目の暗刻（三暗刻）が完成し、ロンだと
    // 明刻になって役が消える場合だけ（門前のロン役なしは門前清自摸和で
    // 和了れるため常に出題する）
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      const menzen = isMenzen(question.waits[0].tsumo.tehai);
      if (menzen) continue;
      for (const wait of question.waits) {
        if (wait.ron) continue;
        expect(wait.tsumo.yakuDetails?.map((yaku) => yaku.name)).toContain(
          "三暗刻",
        );
      }
    }
  });

  it("役なしのロン待ちを持つ聴牌形が出題される", () => {
    // 「この待ちはロンできない」と答えさせるのがこの練習の意義の 1 つ
    const questions = sample(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 3,
      where: (question) => question.waits.some((wait) => !wait.ron),
    });
    expect(questions.length).toBeGreaterThan(0);
  });

  it("リーチしている出題は裏ドラ表示牌を持ち、各待ちの出題にも同じ値が入る", () => {
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 2000,
      need: 10,
      where: (question) => question.isRiichi,
    });
    for (const question of questions) {
      expect(question.uraDoraMarkers).toBeDefined();
      expect(question.uraDoraMarkers?.length).toBe(question.doraMarkers.length);
      for (const cell of listCells(question)) {
        expect(cell.isRiichi).toBe(true);
        expect(cell.uraDoraMarkers).toEqual(question.uraDoraMarkers);
        // 役満になる待ちには立直が乗らない（build-question.test.ts）
        if (cell.answer.yakumanMultiplier >= 1) continue;
        expect(
          cell.yakuDetails?.some((yaku) => yaku.name.includes("立直")),
        ).toBe(true);
      }
      // リーチは役なので、リーチしている出題に役なしのロン待ちは無い
      for (const wait of question.waits) expect(wait.ron).toBeDefined();
    }
  });

  it("リーチしていない出題は裏ドラ表示牌を持たない", () => {
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 50,
      where: (question) => !question.isRiichi,
    });
    for (const question of questions) {
      expect(question.uraDoraMarkers).toBeUndefined();
      for (const cell of listCells(question)) {
        expect(cell.isRiichi).toBe(false);
      }
    }
  });

  it("ドラ表示牌の枚数は 1 + 槓子の数", () => {
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      expect(question.doraMarkers.length).toBe(1 + countKantsu(question.tehai));
    }
  });

  it("どの待ちで和了しても、盤面に見えている牌が 4 枚を超えない", () => {
    // 手牌の中はブランド型が守るが、表示牌と待ち牌は手牌の外にある。
    // 待ち牌が表示牌に取られて 4 枚見えている形（純カラ）も出題しない
    const questions = expectSampled(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      const visible = [
        ...listTehaiHais(question.tehai),
        ...question.doraMarkers,
        ...(question.uraDoraMarkers ?? []),
      ];
      for (const wait of question.waits) {
        expectHaiUsageWithinLimit(
          [...visible, wait.agariHai],
          `待ち ${wait.agariHai}`,
        );
      }
    }
  });

  it("includeFuro=false なら門前の聴牌形だけを出題する", () => {
    const questions = expectSampled(
      () => generateTenpaiScoreQuestion({ includeFuro: false }),
      { attempts: 500, need: 50 },
    );
    for (const question of questions) {
      expect(question.tehai.exposed.every((m) => m.furo === undefined)).toBe(
        true,
      );
    }
  });

  it("副露を含む聴牌形が出題される", () => {
    const questions = sample(generateTenpaiScoreQuestion, {
      attempts: 500,
      need: 3,
      where: (question) => question.tehai.exposed.some((m) => !!m.furo),
    });
    expect(questions.length).toBeGreaterThan(0);
  });

  it("includeParent / includeChild で自風を絞れる", () => {
    const parentOnly = expectSampled(
      () => generateTenpaiScoreQuestion({ includeChild: false }),
      { attempts: 500, need: 30 },
    );
    for (const question of parentOnly) {
      expect(question.jikaze).toBe(HaiKind.Ton);
    }
    const childOnly = expectSampled(
      () => generateTenpaiScoreQuestion({ includeParent: false }),
      { attempts: 500, need: 30 },
    );
    for (const question of childOnly) {
      expect(question.jikaze).not.toBe(HaiKind.Ton);
    }
  });

  it("allowedRanges はすべての待ち・和了方法に掛かる", () => {
    // 高目だけで判定すると、選択肢が点数帯で固定された回答画面で安目を選べない
    const nonMangan = expectSampled(
      () => generateTenpaiScoreQuestion({ allowedRanges: ["nonMangan"] }),
      { attempts: 500, need: 50 },
    );
    for (const cell of nonMangan.flatMap(listCells)) {
      expect(cell.answer.scoreLevel).toBe(ScoreLevel.Normal);
    }
    const manganPlus = expectSampled(
      () => generateTenpaiScoreQuestion({ allowedRanges: ["manganPlus"] }),
      { attempts: 5000, need: 3 },
    );
    for (const cell of manganPlus.flatMap(listCells)) {
      expect(cell.answer.scoreLevel).not.toBe(ScoreLevel.Normal);
    }
  });

  it("同じシードなら同じ問題を返す", () => {
    // 乱数列は試行をまたいで進むため、同じシードで同じ回数試行すれば同じ問題に着く
    const generateWithSeed = (seed: number) => {
      const rng = seededRandom(seed);
      return generateOne(() => generateTenpaiScoreQuestion({ rng }));
    };
    expect(generateWithSeed(20260911)).toEqual(generateWithSeed(20260911));
  });
});

describe("generateValidTenpaiScoreQuestion", () => {
  it("リトライして問題を返す", () => {
    expect(generateValidTenpaiScoreQuestion()).toBeDefined();
  });
});

describe("hasKaraWait", () => {
  // 111m 666m 888p 999p 4z の双碰待ち（待ちは 6m と 4z）
  const tehai = (() => {
    const parsed = parseTehai("111666m888999p4z");
    if (parsed === undefined) throw new Error("MPSZ を読めない");
    return finalizeTehai13(parsed.closed, parsed.exposed);
  })();
  if (!tehai) throw new Error("聴牌形を組めない");
  const waits = [HaiKind.ManZu6, HaiKind.Pei];

  it("手牌と表示牌で 4 枚見えていない待ちだけなら純カラではない", () => {
    expect(hasKaraWait(tehai, waits, [HaiKind.PinZu7])).toBe(false);
  });

  it("手牌の 3 枚と表示牌の 1 枚で 4 枚見えた待ちは純カラ", () => {
    expect(hasKaraWait(tehai, waits, [HaiKind.ManZu6])).toBe(true);
  });

  it("手牌に 1 枚の待ちは表示牌 3 枚で純カラになる", () => {
    expect(
      hasKaraWait(tehai, waits, [HaiKind.Pei, HaiKind.Pei, HaiKind.Pei]),
    ).toBe(true);
    expect(hasKaraWait(tehai, waits, [HaiKind.Pei, HaiKind.Pei])).toBe(false);
  });
});

describe("fitsAnswerOptions", () => {
  const question = generateValidTenpaiScoreQuestion({ rng: seededRandom(3) });
  if (!question) throw new Error("テスト用の問題を生成できなかった");
  const scored = question.waits.map((wait) => ({
    ...wait,
    agariTehai: question.waits[0].tsumo.tehai,
  }));

  it("両方の点数帯を許せば生成器が通した問題は収まる", () => {
    expect(fitsAnswerOptions(scored, ["nonMangan", "manganPlus"])).toBe(true);
  });

  it("どの待ちのどの和了方法も外れないときだけ true", () => {
    const levels = listCells(question).map((cell) => cell.answer.scoreLevel);
    const allNormal = levels.every((level) => level === ScoreLevel.Normal);
    const allMangan = levels.every((level) => level !== ScoreLevel.Normal);
    expect(fitsAnswerOptions(scored, ["nonMangan"])).toBe(allNormal);
    expect(fitsAnswerOptions(scored, ["manganPlus"])).toBe(allMangan);
  });

  it("役なしのロン（undefined）は判定の対象から外す", () => {
    const withNoYakuRon = scored.map((wait) => ({ ...wait, ron: undefined }));
    const tsumoLevels = question.waits.map(
      (wait) => wait.tsumo.answer.scoreLevel,
    );
    expect(fitsAnswerOptions(withNoYakuRon, ["nonMangan"])).toBe(
      tsumoLevels.every((level) => level === ScoreLevel.Normal),
    );
  });
});

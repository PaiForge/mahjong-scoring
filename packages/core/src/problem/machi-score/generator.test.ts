import { describe, it, expect } from "vitest";
import {
  HaiKind,
  calculateScoreForTehai,
  calculateShanten,
  getUkeire,
  isMenzen,
} from "@pai-forge/riichi-mahjong";
import {
  generateMachiScoreQuestion,
  generateValidMachiScoreQuestion,
} from "./generator";
import type { MachiScoreQuestion } from "./types";
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
function listCells(question: MachiScoreQuestion) {
  return question.waits.flatMap((wait) =>
    wait.ron ? [wait.tsumo, wait.ron] : [wait.tsumo],
  );
}

describe("generateMachiScoreQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateMachiScoreQuestion);
  });

  it("聴牌形は面子手として聴牌している", () => {
    const questions = expectSampled(generateMachiScoreQuestion, {
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
    const questions = expectSampled(generateMachiScoreQuestion, {
      attempts: 500,
      need: 100,
    });
    for (const question of questions) {
      const waits = question.waits.map((wait) => wait.agariHai);
      expect(waits.length).toBeGreaterThanOrEqual(2);
      expect(waits).toEqual([...waits].sort((a, b) => a - b));
      expect(waits).toEqual(getUkeire(question.tehai));
    }
  });

  it("各待ちの出題は聴牌形に待ち牌を 1 枚足した和了形で、独立に計算し直した点数と一致する", () => {
    const questions = expectSampled(generateMachiScoreQuestion, {
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
          expect([...cell.tehai.closed].sort((a, b) => a - b)).toEqual(
            [...question.tehai.closed, wait.agariHai].sort((a, b) => a - b),
          );
          expect(cell.tehai.exposed).toEqual(question.tehai.exposed);

          // リーチ無しの出題は、ライブラリの素の計算と翻・符・支払いが一致する
          if (!question.isRiichi) {
            const recomputed = calculateScoreForTehai(cell.tehai, {
              agariHai: cell.agariHai,
              isTsumo: cell.isTsumo,
              jikaze: cell.jikaze,
              bakaze: cell.bakaze,
              doraMarkers: cell.doraMarkers,
            });
            expect(recomputed.isOk()).toBe(true);
            if (recomputed.isOk()) {
              expect(cell.answer.han).toBe(recomputed.value.han);
              expect(cell.answer.fu).toBe(recomputed.value.fu);
              expect(cell.answer.payment).toEqual(recomputed.value.payment);
            }
          }
        }
        expect(wait.tsumo.isTsumo).toBe(true);
        if (wait.ron) expect(wait.ron.isTsumo).toBe(false);
      }
    }
  });

  it("翻数は役の内訳の合計と一致する", () => {
    // 結果表示は役の内訳を出すため、ここがずれると画面で見えてしまう
    const questions = expectSampled(generateMachiScoreQuestion, {
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
    const questions = expectSampled(generateMachiScoreQuestion, {
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
    const questions = sample(generateMachiScoreQuestion, {
      attempts: 500,
      need: 3,
      where: (question) => question.waits.some((wait) => !wait.ron),
    });
    expect(questions.length).toBeGreaterThan(0);
  });

  it("リーチしている出題は裏ドラ表示牌を持ち、各待ちの出題にも同じ値が入る", () => {
    const questions = expectSampled(generateMachiScoreQuestion, {
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
        expect(
          cell.yakuDetails?.some((yaku) => yaku.name.includes("立直")),
        ).toBe(true);
      }
      // リーチは役なので、リーチしている出題に役なしのロン待ちは無い
      for (const wait of question.waits) expect(wait.ron).toBeDefined();
    }
  });

  it("リーチしていない出題は裏ドラ表示牌を持たない", () => {
    const questions = expectSampled(generateMachiScoreQuestion, {
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
    const questions = expectSampled(generateMachiScoreQuestion, {
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
    const questions = expectSampled(generateMachiScoreQuestion, {
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
      () => generateMachiScoreQuestion({ includeFuro: false }),
      { attempts: 500, need: 50 },
    );
    for (const question of questions) {
      expect(question.tehai.exposed.every((m) => m.furo === undefined)).toBe(
        true,
      );
    }
  });

  it("副露を含む聴牌形が出題される", () => {
    const questions = sample(generateMachiScoreQuestion, {
      attempts: 500,
      need: 3,
      where: (question) => question.tehai.exposed.some((m) => !!m.furo),
    });
    expect(questions.length).toBeGreaterThan(0);
  });

  it("includeParent / includeChild で自風を絞れる", () => {
    const parentOnly = expectSampled(
      () => generateMachiScoreQuestion({ includeChild: false }),
      { attempts: 500, need: 30 },
    );
    for (const question of parentOnly) {
      expect(question.jikaze).toBe(HaiKind.Ton);
    }
    const childOnly = expectSampled(
      () => generateMachiScoreQuestion({ includeParent: false }),
      { attempts: 500, need: 30 },
    );
    for (const question of childOnly) {
      expect(question.jikaze).not.toBe(HaiKind.Ton);
    }
  });

  it("allowedRanges はすべての待ち・和了方法に掛かる", () => {
    // 高目だけで判定すると、選択肢が点数帯で固定された回答画面で安目を選べない
    const nonMangan = expectSampled(
      () => generateMachiScoreQuestion({ allowedRanges: ["nonMangan"] }),
      { attempts: 500, need: 50 },
    );
    for (const cell of nonMangan.flatMap(listCells)) {
      expect(cell.answer.scoreLevel).toBe(ScoreLevel.Normal);
    }
    const manganPlus = expectSampled(
      () => generateMachiScoreQuestion({ allowedRanges: ["manganPlus"] }),
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
      return generateOne(() => generateMachiScoreQuestion({ rng }));
    };
    expect(generateWithSeed(20260911)).toEqual(generateWithSeed(20260911));
  });
});

describe("generateValidMachiScoreQuestion", () => {
  it("リトライして問題を返す", () => {
    expect(generateValidMachiScoreQuestion()).toBeDefined();
  });
});

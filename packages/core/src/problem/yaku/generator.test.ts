import { describe, it, expect } from "vitest";
import { generateYakuQuestion } from "./generator";
import { countKantsu } from "../shared/count-kantsu";
import { countHaiInTehai, listTehaiHais } from "../../core/hai-count";
import {
  expectAgariHaiNotKantsuKind,
  expectHaiUsageWithinLimit,
} from "../../test/tile-usage";
import { getKazeYakuhaiDisplayName, SELECTABLE_YAKU } from "./constants";
import type { YakuQuestion } from "./types";
import { YAKU_OPTION_GROUPS } from "../../core/yaku-names";
import { defaultIdGenerator } from "../../core/id";
import { YAKUMAN_HAN } from "../../score/tiers";
import {
  expectGeneratesEventually,
  expectSampled,
  generateOne,
} from "../../test/sampling";
import { seededRandom } from "../../test/seeded-random";

/** 役満の表示名。役満の手は通常役と複合せず、正解に並ぶのは役満だけになる */
const YAKUMAN_NAMES: ReadonlySet<string> = new Set(
  YAKU_OPTION_GROUPS.filter((group) => group.han === YAKUMAN_HAN).flatMap(
    (group) => group.names,
  ),
);

function isYakumanQuestion(question: YakuQuestion): boolean {
  return question.correctYakuNames.some((name) => YAKUMAN_NAMES.has(name));
}

/** 場風牌を刻子（または槓子）で持つ手 */
function hasBakazeKoutsu(question: YakuQuestion): boolean {
  return countHaiInTehai(question.tehai, question.context.bakaze) >= 3;
}

describe("generateYakuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateYakuQuestion);
  });

  it("生成された問題が正しい構造を持つ", () => {
    const question = generateOne(generateYakuQuestion);

    expect(question.id).toBeTruthy();
    expect(question.tehai).toBeDefined();
    expect(question.context.bakaze).toBeDefined();
    expect(question.context.jikaze).toBeDefined();
    expect(question.context.agariHai).toBeDefined();
    expect(typeof question.context.isTsumo).toBe("boolean");
    expect(typeof question.context.isRiichi).toBe("boolean");
    expect(Array.isArray(question.context.doraMarkers)).toBe(true);
    expect(question.correctYakuNames.length).toBeGreaterThan(0);
  });

  it("正解の役名が SELECTABLE_YAKU に含まれる", () => {
    const selectableSet = new Set(SELECTABLE_YAKU);
    const questions = expectSampled(generateYakuQuestion, { attempts: 200 });

    for (const question of questions) {
      for (const yakuName of question.correctYakuNames) {
        expect(selectableSet.has(yakuName)).toBe(true);
      }
    }
  });

  it("isRiichi が true の場合、立直が正解に含まれる", () => {
    // 役満の手は例外（次のテスト）
    const questions = expectSampled(generateYakuQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => q.context.isRiichi && !isYakumanQuestion(q),
    });

    for (const question of questions) {
      expect(question.correctYakuNames).toContain("立直");
    }
  });

  it("役満の手はリーチしていても立直を正解に並べない", () => {
    // 役満は通常役と複合しない。リーチ棒は盤面に出たままで、正解は役満だけ。
    // リーチしている役満は生成の 1000 回に 1 回ほどなので、シードを固定して
    // 試行回数の中に必ず現れる数列で回す
    const rng = seededRandom(20261006);
    const questions = expectSampled(
      () => generateYakuQuestion(defaultIdGenerator, rng),
      {
        need: 3,
        attempts: 20000,
        where: (q) => q.context.isRiichi && isYakumanQuestion(q),
      },
    );

    for (const question of questions) {
      expect(question.correctYakuNames).not.toContain("立直");
      expect(
        question.correctYakuNames.every((name) => YAKUMAN_NAMES.has(name)),
      ).toBe(true);
    }
  });

  it("場風の刻子があれば風ごとの表示名（役牌 東 等）が正解に1回だけ含まれる", () => {
    // ライブラリは場風の役牌を "Bakaze" で返す。この練習は風ごとの選択肢で
    // 答えさせるため局面の風に引き直す。連風牌では場風・自風が同じ表示名に
    // なるので、重複して並ばないこと。
    // 役満の手（場風の暗刻を含む四暗刻・四槓子等）は役満だけが正解になり
    // 役牌が並ばないので、ここでは対象から外す（次のテストで確かめる）
    const questions = expectSampled(generateYakuQuestion, {
      need: 10,
      attempts: 2000,
      where: (q) => hasBakazeKoutsu(q) && !isYakumanQuestion(q),
    });

    for (const question of questions) {
      const name = getKazeYakuhaiDisplayName(question.context.bakaze);
      expect(question.correctYakuNames.filter((n) => n === name)).toHaveLength(
        1,
      );
      expect(new Set(question.correctYakuNames).size).toBe(
        question.correctYakuNames.length,
      );
    }
  });

  it("役満の手では場風の刻子があっても役牌を正解に並べない", () => {
    // 役満は通常役と複合しない（ライブラリは役満の手で "Bakaze" を返さない）。
    // 場風牌 3 枚を持つ役満は生成の 2000 回に 1 回ほどしか出ないため、
    // Math.random では母集団が試行内に集まるかが実行ごとに変わる。シードを
    // 固定して、試行回数の中に必ず現れる数列で回す
    const rng = seededRandom(20261006);
    const questions = expectSampled(
      () => generateYakuQuestion(defaultIdGenerator, rng),
      {
        need: 3,
        attempts: 20000,
        where: (q) => hasBakazeKoutsu(q) && isYakumanQuestion(q),
      },
    );

    for (const question of questions) {
      const name = getKazeYakuhaiDisplayName(question.context.bakaze);
      expect(question.correctYakuNames).not.toContain(name);
    }
  });

  it("手牌とドラ表示牌を合わせても同じ牌が5枚にならない", () => {
    // 表示牌も山から取る 1 枚。手牌で使い切った牌種が表示牌にも出ると、
    // その牌が 5 枚要る盤面になる（実物の麻雀では起こり得ない）。
    const questions = expectSampled(generateYakuQuestion, {
      need: 200,
      attempts: 400,
    });

    for (const question of questions) {
      expectHaiUsageWithinLimit(
        [
          ...listTehaiHais(question.tehai),
          ...question.context.doraMarkers,
          ...(question.context.uraDoraMarkers ?? []),
        ],
        "役判定の出題",
      );
    }
  });

  it("槓子のある問題はその数だけドラ表示牌が増える", () => {
    // カン 1 回につき新ドラが 1 枚めくられる（表示牌は 1 + 槓子数）。
    const questions = expectSampled(generateYakuQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => countKantsu(q.tehai) > 0,
    });

    for (const question of questions) {
      expect(question.context.doraMarkers).toHaveLength(
        1 + countKantsu(question.tehai),
      );
    }
  });

  it("リーチの問題だけが裏ドラ表示牌を持ち、枚数は表ドラと揃う", () => {
    // 実際の麻雀と同じく、裏ドラをめくるのは立直している手だけ。表示牌の
    // 枚数は槓の数で決まるため表ドラと同数になる。
    const questions = expectSampled(generateYakuQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => q.context.isRiichi,
    });

    for (const question of questions) {
      expect(question.context.uraDoraMarkers).toHaveLength(
        question.context.doraMarkers.length,
      );
    }

    const notRiichi = expectSampled(generateYakuQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => !q.context.isRiichi,
    });

    for (const question of notRiichi) {
      expect(question.context.uraDoraMarkers).toBeUndefined();
    }
  });

  it("生成された問題の tehai と context フィールドが正しい型を持つ", () => {
    const question = generateOne(generateYakuQuestion);

    // tehai の構造
    expect(question.tehai.closed).toBeDefined();
    expect(Array.isArray(question.tehai.closed)).toBe(true);
    expect(question.tehai.exposed).toBeDefined();
    expect(Array.isArray(question.tehai.exposed)).toBe(true);

    // context のフィールド
    expect(typeof question.context.bakaze).toBe("number");
    expect(typeof question.context.jikaze).toBe("number");
    expect(typeof question.context.agariHai).toBe("number");
    expect(question.context.doraMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it("isTsumo=true かつ門前の場合、門前清自摸和が含まれるケースがある", () => {
    // 1件も出ないこと自体が異常なので、expectSampled の非空保証が検証になる
    expectSampled(generateYakuQuestion, {
      need: 1,
      attempts: 1000,
      where: (q) =>
        q.context.isTsumo && q.correctYakuNames.includes("門前清自摸和"),
    });
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    const questions = expectSampled(generateYakuQuestion, {
      attempts: 2000,
      need: 2000,
    });

    expectAgariHaiNotKantsuKind(questions);
  });

  it("偶然役・ドラが正解に含まれない", () => {
    const excludedNames = [
      "ドラ",
      "裏ドラ",
      "一発",
      "海底摸月",
      "河底撈魚",
      "嶺上開花",
      "槍槓",
      "ダブル立直",
      "天和",
      "地和",
    ];

    const questions = expectSampled(generateYakuQuestion, {
      need: 200,
      attempts: 400,
    });

    for (const question of questions) {
      for (const excluded of excludedNames) {
        expect(question.correctYakuNames).not.toContain(excluded);
      }
    }
  });
});

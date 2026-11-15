import { describe, expect, it } from "vitest";
import { isMenzen } from "@pai-forge/riichi-mahjong";
import { ALL_YAKUMAN_RULES_ENABLED } from "../../rules/settings";
import { seededRandom } from "../../test/seeded-random";
import { generateScoreQuestion } from "../score/generator";
import type { ScoreQuestion } from "../score/types";
import { generateTenpaiScoreQuestion } from "../tenpai-score/generator";
import type { TenpaiScoreQuestion } from "../tenpai-score/types";
import { archiveIdentityInput } from "./identity";
import { rebuildAgariQuestion, rebuildTenpaiQuestion } from "./rebuild";
import {
  agariRequest,
  ankanRiichiAgariQuestion,
  meldedAgariQuestion,
  noYakuRonTenpaiQuestion,
  overTheWire,
  riichiTenpaiQuestion,
  STANDARD_RULES,
  tenpaiRequest,
} from "./test-fixtures";
import { parsePracticeProblemArchiveRequest } from "./validate";

/** 1 つのルール設定あたりに集める問題の数 */
const SAMPLES_PER_RULES = 2000;

/** 生成するルール設定: 全ルール無効と全ルール有効 */
const RULE_SETS = [
  { name: "全ルール無効", options: {} },
  {
    name: "全ルール有効",
    options: {
      renfonpaiAs4Fu: true,
      kiriageMangan: true,
      yakumanRules: ALL_YAKUMAN_RULES_ENABLED,
    },
  },
] as const;

function collect<T>(generate: () => T | undefined, need: number): T[] {
  const collected: T[] = [];
  for (let i = 0; i < need * 50 && collected.length < need; i++) {
    const value = generate();
    if (value) collected.push(value);
  }
  expect(collected).toHaveLength(need);
  return collected;
}

/** 保存の要求を送信経路に通して検証し、受け付けた盤面を返す */
function acceptedAgari(question: ScoreQuestion) {
  const request = agariRequest(question);
  const parsed = parsePracticeProblemArchiveRequest(overTheWire(request));
  expect(parsed.isOk(), JSON.stringify(request)).toBe(true);
  const accepted = parsed._unsafeUnwrap();
  if (accepted.kind !== "agari-score") throw new Error(accepted.kind);
  expect(archiveIdentityInput(accepted)).toBe(archiveIdentityInput(request));
  return accepted.payload;
}

function acceptedTenpai(question: TenpaiScoreQuestion) {
  const request = tenpaiRequest(question);
  const parsed = parsePracticeProblemArchiveRequest(overTheWire(request));
  expect(parsed.isOk(), JSON.stringify(request)).toBe(true);
  const accepted = parsed._unsafeUnwrap();
  if (accepted.kind !== "tenpai-score") throw new Error(accepted.kind);
  expect(archiveIdentityInput(accepted)).toBe(archiveIdentityInput(request));
  return accepted.payload;
}

describe("生成した問題の保存と組み立て直し（性質）", () => {
  for (const [index, { name, options }] of RULE_SETS.entries()) {
    it(`和了形: ${name}で生成した問題は標準ルールの検証を通り、生成時のルールで組み立て直すと元の問題に一致する`, () => {
      const rng = seededRandom(1000 + index);
      const questions = collect(
        () => generateScoreQuestion({ ...options, includeChiitoi: true, rng }),
        SAMPLES_PER_RULES,
      );
      for (const question of questions) {
        const payload = acceptedAgari(question);
        const rebuilt = rebuildAgariQuestion(payload, question.ruleConfig);
        expect(rebuilt._unsafeUnwrap()).toStrictEqual(question);
      }
      // 副露・七対子・リーチの盤面を実際に通したこと
      const names = (q: ScoreQuestion) => q.yakuDetails.map((y) => y.name);
      expect(questions.some((q) => q.tehai.exposed.length > 0)).toBe(true);
      expect(questions.some((q) => names(q).includes("七対子"))).toBe(true);
      expect(questions.some((q) => q.isRiichi)).toBe(true);
    });

    it(`聴牌形: ${name}で生成した問題は標準ルールの検証を通り、生成時のルールで組み立て直すと元の問題に一致する`, () => {
      const rng = seededRandom(2000 + index);
      const questions = collect(
        () => generateTenpaiScoreQuestion({ ...options, rng }),
        SAMPLES_PER_RULES,
      );
      for (const question of questions) {
        const payload = acceptedTenpai(question);
        const ruleConfig = question.waits[0].tsumo.ruleConfig;
        const rebuilt = rebuildTenpaiQuestion(payload, ruleConfig);
        expect(rebuilt._unsafeUnwrap()).toStrictEqual(question);
      }
      expect(questions.some((q) => !isMenzen(q.waits[0].tsumo.tehai))).toBe(
        true,
      );
      expect(questions.some((q) => q.isRiichi)).toBe(true);
      expect(
        questions.some((q) => q.waits.some((wait) => wait.ron === undefined)),
      ).toBe(true);
    });
  }
});

describe("固定の盤面の保存と組み立て直し", () => {
  it("チー・ポン・大明槓・加槓は鳴いた順・鳴いた牌・鳴き元のまま往復する", () => {
    const question = meldedAgariQuestion();
    const payload = acceptedAgari(question);
    expect(payload.hand.exposed).toEqual([
      { type: "chi", hais: [1, 2, 3], nakiHai: 2 },
      { type: "pon", hais: [31, 31, 31], from: "shimocha" },
      { type: "daiminkan", hais: [17, 17, 17, 17], from: "kamicha" },
      { type: "kakan", hais: [18, 18, 18, 18], from: "toimen" },
    ]);
    expect(
      rebuildAgariQuestion(payload, question.ruleConfig)._unsafeUnwrap(),
    ).toStrictEqual(question);
  });

  it("暗槓とリーチ・裏ドラ表示牌は往復する", () => {
    const question = ankanRiichiAgariQuestion();
    const payload = acceptedAgari(question);
    expect(payload.hand.exposed).toEqual([
      { type: "ankan", hais: [10, 10, 10, 10] },
    ]);
    expect(payload.riichi).toEqual({ uraDoraMarkers: [29, 13] });
    expect(
      rebuildAgariQuestion(payload, question.ruleConfig)._unsafeUnwrap(),
    ).toStrictEqual(question);
  });

  it("役なしのロン待ちを持つ聴牌形は往復する", () => {
    const question = noYakuRonTenpaiQuestion();
    expect(question.waits.some((wait) => wait.ron === undefined)).toBe(true);
    const payload = acceptedTenpai(question);
    expect(payload.riichi).toBeNull();
    expect(
      rebuildTenpaiQuestion(
        payload,
        question.waits[0].tsumo.ruleConfig,
      )._unsafeUnwrap(),
    ).toStrictEqual(question);
  });

  it("リーチした聴牌形は裏ドラ表示牌ごと往復する", () => {
    const question = riichiTenpaiQuestion();
    const payload = acceptedTenpai(question);
    expect(payload.riichi).toEqual({ uraDoraMarkers: [8] });
    expect(
      rebuildTenpaiQuestion(
        payload,
        question.waits[0].tsumo.ruleConfig,
      )._unsafeUnwrap(),
    ).toStrictEqual(question);
  });

  it("盤面にルール設定・正解・待ちを載せない", () => {
    const agari = agariRequest(meldedAgariQuestion()).payload;
    const tenpai = tenpaiRequest(riichiTenpaiQuestion()).payload;
    expect(Object.keys(agari).sort()).toEqual([
      "agariHai",
      "bakaze",
      "doraMarkers",
      "hand",
      "isTsumo",
      "jikaze",
      "riichi",
    ]);
    expect(Object.keys(tenpai).sort()).toEqual([
      "bakaze",
      "doraMarkers",
      "hand",
      "jikaze",
      "riichi",
    ]);
  });

  it("組み立て直しは渡したルールで採点する（保存した盤面はルールを持たない）", () => {
    // 222m 456p 789s 234s 東東 を 3s の嵌張でツモ。東場の東家で、東の雀頭は連風牌
    const payload = {
      hand: {
        closed: [1, 1, 1, 12, 13, 14, 19, 20, 21, 24, 25, 26, 27, 27],
        exposed: [],
      },
      agariHai: 20,
      isTsumo: true,
      jikaze: 27,
      bakaze: 27,
      doraMarkers: [30],
      riichi: null,
    };
    const standard = rebuildAgariQuestion(payload, STANDARD_RULES);
    const renfonpai4 = rebuildAgariQuestion(payload, {
      ...STANDARD_RULES,
      doubleWindJantouFu: 4,
    });
    expect(standard._unsafeUnwrap().answer.fu).toBe(30);
    expect(renfonpai4._unsafeUnwrap().answer.fu).toBe(40);
  });
});

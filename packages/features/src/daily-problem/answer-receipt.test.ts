import { describe, expect, it } from "vitest";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { ScoreAnswerFacts } from "@mahjong-scoring/core";

import type { DailyAnswerDetail } from "./answer-detail";
import {
  buildDailyAnswerSnapshot,
  isSameDailyAnswer,
  judgeDailyAnswerAtReceipt,
} from "./answer-receipt";
import {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  yakumanAgariPayload,
} from "./test-fixtures";

const client: DailyAnswerDetail["client"] = {
  scoringVersion: 1,
  ruleSettings: DEFAULT_RULE_SETTINGS,
  scoreInput: "select",
  koTsumoInput: "split",
};

const scoreOnly = {
  requireYaku: false,
  requireHanFu: false,
  exactHan: false,
  requireFuForMangan: false,
};

/** 適格な盤面（2 翻 30 符の子ツモ 500 / 1000）への解答 */
function answered(
  answer: Extract<DailyAnswerDetail, { outcome: "answered" }>["answer"],
  mode: DailyAnswerDetail["mode"] = scoreOnly,
): DailyAnswerDetail {
  return { v: 1, outcome: "answered", mode, answer, client };
}

const gaveUp: DailyAnswerDetail = {
  v: 1,
  outcome: "gaveUp",
  mode: scoreOnly,
  client,
};

function snapshotOf(payload = eligibleAgariPayload()) {
  const snapshot = buildDailyAnswerSnapshot(payload, "selection-build");
  if (snapshot === undefined) throw new Error("snapshot expected");
  return snapshot;
}

describe("buildDailyAnswerSnapshot", () => {
  it("適格な盤面の標準ルールの正解と属性を、採点の版とデプロイ付きで写す", () => {
    expect(snapshotOf()).toMatchObject({
      v: 1,
      scoringVersion: 1,
      revision: "selection-build",
      answer: {
        han: 2,
        fu: 30,
        payment: { type: "koTsumo", amount: [500, 1000] },
        yaku: [
          { id: "MenzenTsumo", han: 1 },
          { id: "Riichi", han: 1 },
        ],
      },
      facets: { isTsumo: true, isRiichi: true, jikaze: 29, agariHai: 22 },
    });
    expect(
      buildDailyAnswerSnapshot(eligibleAgariPayload(), null),
    ).toMatchObject({ revision: null });
  });

  it("ルールで正解が割れる盤面・役満の盤面には作らない", () => {
    expect(
      buildDailyAnswerSnapshot(kiriageBoundaryAgariPayload(), null),
    ).toBeUndefined();
    expect(
      buildDailyAnswerSnapshot(yakumanAgariPayload(), null),
    ).toBeUndefined();
  });
});

describe("isSameDailyAnswer", () => {
  const { answer } = snapshotOf();

  it("役の順序だけが違う正解は同じとみなす", () => {
    expect(
      isSameDailyAnswer(answer, {
        ...answer,
        yaku: [...answer.yaku].reverse(),
      }),
    ).toBe(true);
  });

  it("翻・支払い・役・ドラの翻のどれかが違えば別の正解", () => {
    const [first, ...rest] = answer.yaku;
    if (first === undefined) throw new Error("yaku expected");
    const variants: ScoreAnswerFacts[] = [
      { ...answer, han: 3 },
      { ...answer, fu: 40 },
      { ...answer, scoreLevel: "Mangan" },
      { ...answer, yakumanMultiplier: 1 },
      { ...answer, payment: { type: "koTsumo", amount: [500, 1100] } },
      { ...answer, payment: { type: "ron", amount: 2000 } },
      { ...answer, yaku: rest },
      { ...answer, yaku: [{ ...first, han: 2 }, ...rest] },
      { ...answer, doraHan: 1 },
      { ...answer, uraDoraHan: 1 },
    ];
    for (const variant of variants)
      expect(isSameDailyAnswer(answer, variant)).toBe(false);
  });
});

describe("judgeDailyAnswerAtReceipt", () => {
  const payload = eligibleAgariPayload();

  it("点数だけを問う解答は、点数を判定して他の欄を対象外にする", () => {
    expect(
      judgeDailyAnswerAtReceipt(
        payload,
        answered({ scoreFromKo: 500, scoreFromOya: 1000, yaku: [] }),
        snapshotOf(),
      ),
    ).toEqual({
      kind: "judged",
      fields: {
        score: "correct",
        han: "notJudged",
        fu: "notJudged",
        yaku: "notJudged",
      },
      judgedCorrect: true,
      snapshotConsistent: true,
    });
  });

  it("役を問う解答は、役 ID を選択肢の役名に直して判定する", () => {
    const mode = { ...scoreOnly, requireYaku: true, requireHanFu: true };
    const correct = judgeDailyAnswerAtReceipt(
      payload,
      answered(
        {
          han: 2,
          fu: 30,
          scoreFromKo: 500,
          scoreFromOya: 1000,
          yaku: ["Riichi", "MenzenTsumo"],
        },
        mode,
      ),
      null,
    );
    expect(correct).toMatchObject({
      fields: {
        score: "correct",
        han: "correct",
        fu: "correct",
        yaku: "correct",
      },
      judgedCorrect: true,
    });
    const wrongYaku = judgeDailyAnswerAtReceipt(
      payload,
      answered(
        {
          han: 2,
          fu: 30,
          scoreFromKo: 500,
          scoreFromOya: 1000,
          yaku: ["Riichi"],
        },
        mode,
      ),
      null,
    );
    expect(wrongYaku).toMatchObject({
      fields: { score: "correct", yaku: "incorrect" },
      judgedCorrect: false,
    });
  });

  it("満貫未満の正解に 5 翻を選んで符を入れていない解答は、符の誤答として判定する", () => {
    expect(
      judgeDailyAnswerAtReceipt(
        payload,
        answered(
          { han: 5, scoreFromKo: 2000, scoreFromOya: 4000, yaku: [] },
          { ...scoreOnly, requireHanFu: true },
        ),
        null,
      ),
    ).toMatchObject({
      fields: { score: "incorrect", han: "incorrect", fu: "incorrect" },
      judgedCorrect: false,
    });
  });

  it("選出時の情報が無い日は一致を持たず、正解が違う日は不一致を残す", () => {
    const detail = answered({ scoreFromKo: 500, scoreFromOya: 1000, yaku: [] });
    expect(judgeDailyAnswerAtReceipt(payload, detail, null)).toMatchObject({
      kind: "judged",
      snapshotConsistent: null,
    });
    expect(
      judgeDailyAnswerAtReceipt(
        payload,
        detail,
        snapshotOf(otherEligibleAgariPayload()),
      ),
    ).toMatchObject({ kind: "judged", snapshotConsistent: false });
  });

  it("属性・版・デプロイだけが違うスナップショットは一致とみなす", () => {
    const snapshot = snapshotOf();
    expect(
      judgeDailyAnswerAtReceipt(payload, gaveUp, {
        ...snapshot,
        scoringVersion: 7,
        revision: null,
        facets: { ...snapshot.facets, machi: "Tanki", kanCount: 1 },
      }),
    ).toMatchObject({ snapshotConsistent: true });
  });

  it("適格な盤面の「わからない」は欄を判定せず、総合を不正解にして一致は比べる", () => {
    expect(judgeDailyAnswerAtReceipt(payload, gaveUp, snapshotOf())).toEqual({
      kind: "judged",
      fields: null,
      judgedCorrect: false,
      snapshotConsistent: true,
    });
  });

  it("受付時に不適格な盤面は、解答も「わからない」も採点不能にする", () => {
    const ineligible = kiriageBoundaryAgariPayload();
    for (const detail of [
      answered({ scoreFromKo: 2000, scoreFromOya: 4000, yaku: [] }),
      gaveUp,
    ])
      expect(judgeDailyAnswerAtReceipt(ineligible, detail, null)).toEqual({
        kind: "unjudgeable",
        judgeError: "ineligible",
      });
  });

  it("標準ルールで組み立てられない盤面は、その理由で採点不能にする", () => {
    expect(
      judgeDailyAnswerAtReceipt(
        { ...payload, agariHai: 33 },
        gaveUp,
        snapshotOf(),
      ),
    ).toEqual({ kind: "unjudgeable", judgeError: "agariHaiNotInHand" });
  });
});

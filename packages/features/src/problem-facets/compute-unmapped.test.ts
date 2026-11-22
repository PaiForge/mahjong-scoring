import type { ScoreQuestion } from "@mahjong-scoring/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { eligibleAgariPayload } from "../daily-problem/test-fixtures";

import { computeProblemFacets } from "./compute";
import {
  agariInput,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  tenpaiInput,
} from "./test-fixtures";

// 役 ID に写せない内訳はライブラリの改名でしか起きないので、取り出しを差し替えて再現する
const { unmapped } = vi.hoisted(() => ({
  /** 真を返した問題の取り出しを「写せない」にする */
  unmapped: vi.fn<(question: ScoreQuestion, call: number) => boolean>(),
}));
let calls = 0;
vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@mahjong-scoring/core")>();
  return {
    ...original,
    extractScoreFacts: (question: ScoreQuestion) => {
      calls += 1;
      return unmapped(question, calls)
        ? undefined
        : original.extractScoreFacts(question);
    },
  };
});

beforeEach(() => {
  calls = 0;
  unmapped.mockReset();
});

const FAILED = { set: { status: "failed", error: "unmappedYaku" }, rows: [] };

describe("computeProblemFacets（役 ID に写せない内訳）", () => {
  it("行を作らず、unmappedYaku の failed にする", () => {
    unmapped.mockReturnValue(true);
    expect(computeProblemFacets(agariInput(eligibleAgariPayload()))).toEqual(
      FAILED,
    );
    expect(computeProblemFacets(tenpaiInput(riichiTenpaiPayload()))).toEqual(
      FAILED,
    );
    expect(computeProblemFacets(tenpaiInput(noYakuRonTenpaiPayload()))).toEqual(
      FAILED,
    );
  });

  it("聴牌形のロンの和了だけが写せなくても、問題ごと failed にする", () => {
    unmapped.mockImplementation((question) => !question.isTsumo);
    expect(computeProblemFacets(tenpaiInput(riichiTenpaiPayload()))).toEqual(
      FAILED,
    );
  });

  it("標準ルール以外の組み立てでだけ写せないときは、行を作り、そのルールの印を立てる", () => {
    // 和了形は 1 回の組み立てで取り出しが 1 回。標準 → 連風牌 → 切り上げ → 両方 → 役満の順
    unmapped.mockImplementation((_question, call) => call === 5);
    const [row] = computeProblemFacets(agariInput(eligibleAgariPayload())).rows;
    expect(row).toMatchObject({
      result: "scored",
      variesByRenfonpai: false,
      variesByKiriage: false,
      variesByYakumanRules: true,
    });

    calls = 0;
    unmapped.mockImplementation((_question, call) => call === 2);
    expect(
      computeProblemFacets(agariInput(eligibleAgariPayload())).rows[0],
    ).toMatchObject({
      variesByRenfonpai: true,
      variesByKiriage: true,
      variesByYakumanRules: false,
    });

    // 連風牌 4 符 + 切り上げ満貫の組でだけ変わる: どちらの印も「もう一方を固定した組」で立つ
    calls = 0;
    unmapped.mockImplementation((_question, call) => call === 4);
    expect(
      computeProblemFacets(agariInput(eligibleAgariPayload())).rows[0],
    ).toMatchObject({
      variesByRenfonpai: true,
      variesByKiriage: true,
      variesByYakumanRules: false,
    });
  });
});

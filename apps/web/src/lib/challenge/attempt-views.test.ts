import { describe, expect, it } from "vitest";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";
import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

import {
  attemptEntry,
  attemptStatus,
  finishResult,
  isAttemptId,
  outcomeResult,
  parseBeginRequest,
  resumableEntry,
} from "./attempt-views";
import {
  generateChallengeQuestion,
  publicChallengeQuestion,
} from "./questions";
import { startedChallenge } from "./transitions";

const MENU = "machi_fu" as const;
const SETTINGS = { renfonpaiAs4Fu: false };
const ID = "6f1a3f2e-9c1b-4d7a-8e4f-2b9c1d3e5f70";
const T0 = 1_000_000;
const LIMIT_MS = practiceMenuByType(MENU).timeLimit * 1000;

function generatedQuestion(): ChallengeQuestion {
  const generated = generateChallengeQuestion(MENU, "default", SETTINGS);
  if (!generated) throw new Error("出題を作れなかった");
  return generated;
}
const question = generatedQuestion();

/** カウントダウンが明けた直後の状態 */
function running(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return {
    ...startedChallenge(
      { menuType: MENU, variant: "default", settings: SETTINGS, question },
      T0,
    ),
    ...overrides,
  };
}
const START = T0 + 3000;

describe("isAttemptId", () => {
  it("UUID の文字列だけを挑戦 ID と見なす", () => {
    expect(isAttemptId(ID)).toBe(true);
    expect(isAttemptId("not-a-uuid")).toBe(false);
    expect(isAttemptId(42)).toBe(false);
    expect(isAttemptId(undefined)).toBe(false);
  });
});

describe("parseBeginRequest", () => {
  it("練習・バリアント・設定が正しければ要求にする。ID は省略できる", () => {
    expect(parseBeginRequest(MENU, "default", SETTINGS, undefined)).toEqual({
      menuType: MENU,
      variant: "default",
      settings: SETTINGS,
      id: undefined,
    });
    expect(parseBeginRequest(MENU, "default", SETTINGS, ID)?.id).toBe(ID);
  });

  it("知らない練習・バリアント・設定の形・ID の形はどれも拒む", () => {
    expect(parseBeginRequest("nope", "default", SETTINGS, undefined)).toBe(
      undefined,
    );
    expect(parseBeginRequest(MENU, "nope", SETTINGS, undefined)).toBe(
      undefined,
    );
    expect(parseBeginRequest(MENU, "default", {}, undefined)).toBe(undefined);
    expect(
      parseBeginRequest(MENU, "default", { renfonpaiAs4Fu: "yes" }, undefined),
    ).toBe(undefined);
    expect(parseBeginRequest(MENU, "default", SETTINGS, "bad-id")).toBe(
      undefined,
    );
  });
});

describe("attemptEntry", () => {
  it("今の問題番号と、正解を伏せた出題を返す", () => {
    const state = running();
    expect(attemptEntry(ID, state)).toEqual({
      id: ID,
      sequence: state.sequence,
      question: publicChallengeQuestion(question, MENU),
    });
  });
});

describe("resumableEntry", () => {
  const request = {
    menuType: MENU,
    variant: "default",
    settings: SETTINGS,
  } as const;

  it("同じ練習・バリアント・設定の再送には既存の入口を返す", () => {
    const state = running();
    expect(resumableEntry({ id: ID, state, consumed: false }, request)).toEqual(
      attemptEntry(ID, state),
    );
  });

  it("確定済み・別の練習・別のバリアント・別の設定には返さない", () => {
    const state = running();
    expect(
      resumableEntry({ id: ID, state, consumed: true }, request),
    ).toBeUndefined();
    expect(
      resumableEntry(
        { id: ID, state, consumed: false },
        { ...request, menuType: "jantou_fu" },
      ),
    ).toBeUndefined();
    expect(
      resumableEntry(
        { id: ID, state, consumed: false },
        { ...request, variant: "other" },
      ),
    ).toBeUndefined();
    expect(
      resumableEntry(
        { id: ID, state, consumed: false },
        { ...request, settings: { renfonpaiAs4Fu: true } },
      ),
    ).toBeUndefined();
  });
});

describe("outcomeResult / finishResult", () => {
  it("試験は付与した段級位、練習は成績の ID、記録なしは undefined", () => {
    expect(outcomeResult({ kind: "graded", grantedRanks: [] })).toEqual({
      grantedRanks: [],
    });
    expect(
      outcomeResult({ kind: "recorded", challengeResultId: "r1" }),
    ).toEqual({ challengeResultId: "r1" });
    expect(outcomeResult({ kind: "unrecorded" })).toBeUndefined();
  });

  it("記録した練習の確定結果にだけ土俵（練習種別とバリアント）を添える", () => {
    const state = running();
    expect(
      finishResult(state, { kind: "recorded", challengeResultId: "r1" }),
    ).toEqual({ challengeResultId: "r1", menuType: MENU, variant: "default" });
    expect(finishResult(state, { kind: "graded", grantedRanks: [] })).toEqual({
      grantedRanks: [],
    });
    expect(finishResult(state, { kind: "unrecorded" })).toBeUndefined();
  });
});

describe("attemptStatus", () => {
  it("進行中は時計の値と条件を返し、確定の結果は持たない", () => {
    const state = running({ score: 3, incorrectAnswers: 1 });
    const status = attemptStatus(
      { id: ID, state, consumed: false },
      START + 10_000,
    );
    expect(status).toMatchObject({
      ...attemptEntry(ID, state),
      menuType: MENU,
      variant: "default",
      settings: SETTINGS,
      score: 3,
      incorrectAnswers: 1,
      elapsedMs: 10_000,
      remainingMs: LIMIT_MS - 10_000,
      paused: false,
      finished: false,
      outcome: undefined,
    });
  });

  it("確定済みは確定の結果を添える。結果の無い確定は記録なしとして扱う", () => {
    const recorded = running({
      outcome: { kind: "recorded", challengeResultId: "r1" },
    });
    expect(
      attemptStatus({ id: ID, state: recorded, consumed: true }, START),
    ).toMatchObject({ finished: true, outcome: { challengeResultId: "r1" } });
    expect(
      attemptStatus({ id: ID, state: running(), consumed: true }, START),
    ).toMatchObject({ finished: true, outcome: undefined });
  });
});

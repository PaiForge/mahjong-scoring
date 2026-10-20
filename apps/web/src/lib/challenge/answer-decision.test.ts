import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";

const mocked = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("./questions", async (original) => {
  const actual = await original<typeof import("./questions")>();
  return { ...actual, generateChallengeQuestion: mocked.generate };
});

import { decideChallengeAnswer } from "./answer-decision";
import { RESPONSE_GRACE_MS, startedChallenge } from "./transitions";

const MENU = "machi_fu";
const T0 = 1_000_000;
/** カウントダウンが明けた時刻 */
const START = T0 + 3000;
/** 数値の答えを持つ出題。正解は 2 */
const question = {
  id: "q1",
  tiles: [],
  agariHai: 0,
  answer: 2,
} as unknown as ChallengeQuestion;
const next = { ...question, id: "q2" } as unknown as ChallengeQuestion;

function running(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return {
    ...startedChallenge(
      {
        menuType: MENU,
        variant: "default",
        settings: { renfonpaiAs4Fu: false },
        question,
      },
      T0,
    ),
    ...overrides,
  };
}

/** 1 問目に回答を受け付けた直後の行 */
function answeredOnce(answer: unknown = 2) {
  const decision = decideChallengeAnswer(
    { state: running(), consumed: false },
    0,
    answer,
    START,
    () => START + 50,
  );
  if (decision.kind !== "accepted") throw new Error(decision.kind);
  return decision;
}

beforeEach(() => {
  mocked.generate.mockReset();
  mocked.generate.mockReturnValue(next);
});

describe("decideChallengeAnswer", () => {
  it("正解を採点し、次の問題（正解は伏せる）へ進めた状態を返す", () => {
    const { state, response } = answeredOnce(2);
    expect(response).toMatchObject({
      correct: true,
      answered: question,
      sequence: 1,
      elapsedMs: 0,
    });
    expect(response.question).toMatchObject({ id: "q2", answer: 20 });
    expect(state).toMatchObject({
      question: next,
      sequence: 1,
      score: 1,
      incorrectAnswers: 0,
      lastAnswer: {
        sequence: 0,
        answer: 2,
        correct: true,
        answered: question,
        elapsedMs: 0,
      },
    });
  });

  it("不正解も受け付け、ミスとして数える", () => {
    const { state, response } = answeredOnce(3);
    expect(response.correct).toBe(false);
    expect(state).toMatchObject({ score: 0, incorrectAnswers: 1 });
  });

  it("時計の起点は採点の後に読んだ時刻の猶予後", () => {
    const { state } = answeredOnce();
    expect(state.resumedAt).toBe(START + 50 + RESPONSE_GRACE_MS);
  });

  it("直前の問題への同じ回答の再送は、採点し直さず同じ応答を返す", () => {
    const first = answeredOnce(2);
    const replay = decideChallengeAnswer(
      { state: first.state, consumed: false },
      0,
      2,
      START + 800,
      () => START + 850,
    );
    expect(replay).toEqual({ kind: "replay", response: first.response });
    expect(mocked.generate).toHaveBeenCalledTimes(1);
  });

  it("再送の判定は確定済みの行にも効く", () => {
    const first = answeredOnce(2);
    const replay = decideChallengeAnswer(
      { state: first.state, consumed: true },
      0,
      2,
      START + 800,
      () => START + 850,
    );
    expect(replay.kind).toBe("replay");
  });

  it("値が undefined のキーは jsonb に残らないが、同じ回答として扱う", () => {
    const first = answeredOnce({ fu: 2 });
    const replay = decideChallengeAnswer(
      { state: first.state, consumed: false },
      0,
      { fu: 2, note: undefined },
      START + 800,
      () => START + 850,
    );
    expect(replay.kind).toBe("replay");
  });

  it("直前の問題への別の回答は拒否する（答えを見てからの差し替え）", () => {
    const first = answeredOnce(2);
    const decision = decideChallengeAnswer(
      { state: first.state, consumed: false },
      0,
      3,
      START + 800,
      () => START + 850,
    );
    expect(decision).toEqual({ kind: "rejected" });
  });

  it("確定済みの行への新しい回答は拒否する", () => {
    const decision = decideChallengeAnswer(
      { state: running(), consumed: true },
      0,
      2,
      START,
      () => START,
    );
    expect(decision).toEqual({ kind: "rejected" });
  });

  it("制限時間を使い切っていれば時間切れ", () => {
    const limitMs = practiceMenuByType(MENU).timeLimit * 1000;
    const decision = decideChallengeAnswer(
      { state: running(), consumed: false },
      0,
      2,
      START + limitMs,
      () => START + limitMs,
    );
    expect(decision).toEqual({ kind: "expired" });
  });

  it("受け付けられない回答（カウントダウン中・古い番号）は拒否する", () => {
    expect(
      decideChallengeAnswer(
        { state: running(), consumed: false },
        0,
        2,
        START - 1,
        () => START,
      ),
    ).toEqual({ kind: "rejected" });
    expect(
      decideChallengeAnswer(
        { state: running(), consumed: false },
        1,
        2,
        START,
        () => START,
      ),
    ).toEqual({ kind: "rejected" });
  });

  it("次の問題を作れなければ拒否する", () => {
    mocked.generate.mockReturnValueOnce(undefined);
    const decision = decideChallengeAnswer(
      { state: running(), consumed: false },
      0,
      2,
      START,
      () => START,
    );
    expect(decision).toEqual({ kind: "rejected" });
  });
});

import { describe, expect, it } from "vitest";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

import {
  RESPONSE_GRACE_MS,
  answeredChallenge,
  canAnswerChallenge,
  canPauseChallenge,
  challengeElapsed,
  challengeRemainingMs,
  finishedChallengeTime,
  isChallengeTimeUp,
  pausedChallenge,
  startedChallenge,
} from "./transitions";

const MENU = "machi_fu";
const rules = practiceMenuByType(MENU);
const LIMIT_MS = rules.timeLimit * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const T0 = 1_000_000;
const question = { id: "q1" } as unknown as ChallengeQuestion;
const next = { id: "q2" } as unknown as ChallengeQuestion;

/** カウントダウンが明けた直後の状態 */
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
const START = T0 + 3000;

const EXAM = "mangan_exam";
const PASS_LINE = rankRequiringMenu(EXAM)?.requirement.minScore ?? Number.NaN;

/** 昇級試験の、カウントダウンが明けた直後の状態 */
function runningExam(overrides: Partial<ChallengeState> = {}): ChallengeState {
  return running({ menuType: EXAM, ...overrides });
}

describe("startedChallenge", () => {
  it("カウントダウンの間は時計も回答も止めておく", () => {
    const state = running();
    expect(challengeElapsed(state, START - 1)).toBe(0);
    expect(canAnswerChallenge(state, 0, START - 1)).toBe(false);
    expect(canAnswerChallenge(state, 0, START)).toBe(true);
  });
});

describe("canAnswerChallenge", () => {
  it("古い問題番号・停止中・ミス上限後は受け付けない", () => {
    expect(canAnswerChallenge(running(), 1, START)).toBe(false);
    expect(canAnswerChallenge(running({ paused: true }), 0, START)).toBe(false);
    expect(
      canAnswerChallenge(
        running({ incorrectAnswers: rules.mistakeLimit }),
        0,
        START,
      ),
    ).toBe(false);
  });

  it("昇級試験は合格点に届いたら受け付けない", () => {
    expect(
      canAnswerChallenge(runningExam({ score: PASS_LINE - 1 }), 0, START),
    ).toBe(true);
    expect(
      canAnswerChallenge(runningExam({ score: PASS_LINE }), 0, START),
    ).toBe(false);
  });

  it("試験でない練習は正解数で締め切らない", () => {
    expect(canAnswerChallenge(running({ score: 100 }), 0, START)).toBe(true);
  });

  it("制限時間ちょうどで締め切る", () => {
    expect(canAnswerChallenge(running(), 0, START + LIMIT_MS - 1)).toBe(true);
    expect(canAnswerChallenge(running(), 0, START + LIMIT_MS)).toBe(false);
  });

  it("作成から 24 時間を過ぎた行は受け付けない", () => {
    const state = running({ paused: true, elapsedMs: 0 });
    const resumed = pausedChallenge(state, false, T0 + DAY_MS - 1);
    expect(canAnswerChallenge(resumed, 0, T0 + DAY_MS - 1)).toBe(true);
    expect(canAnswerChallenge(resumed, 0, T0 + DAY_MS)).toBe(false);
  });
});

describe("answeredChallenge", () => {
  it("正誤を数え、次の問題へ進めて連打の間隔を空ける", () => {
    const correct = answeredChallenge(running(), true, next, START);
    expect(correct).toMatchObject({
      question: next,
      sequence: 1,
      score: 1,
      incorrectAnswers: 0,
    });
    expect(canAnswerChallenge(correct, 1, START + 799)).toBe(false);
    expect(canAnswerChallenge(correct, 1, START + 800)).toBe(true);

    const wrong = answeredChallenge(running(), false, next, START);
    expect(wrong).toMatchObject({ score: 0, incorrectAnswers: 1 });
  });

  it("受け取った時点の経過を畳み込み、応答の猶予が明けるまで時計を止める", () => {
    const receivedAt = START + 10_000;
    const state = answeredChallenge(running(), true, next, receivedAt);
    expect(state.elapsedMs).toBe(10_000);
    expect(challengeElapsed(state, receivedAt + RESPONSE_GRACE_MS)).toBe(
      10_000,
    );
    expect(challengeElapsed(state, receivedAt + RESPONSE_GRACE_MS + 500)).toBe(
      10_500,
    );
  });

  it("受け取ってから応答を組むまでの処理時間を数えない", () => {
    const receivedAt = START + 10_000;
    const respondedAt = receivedAt + 300;
    const state = answeredChallenge(
      running(),
      true,
      next,
      receivedAt,
      respondedAt,
    );
    expect(state.elapsedMs).toBe(10_000);
    expect(challengeElapsed(state, respondedAt + RESPONSE_GRACE_MS)).toBe(
      10_000,
    );
    expect(challengeElapsed(state, respondedAt + RESPONSE_GRACE_MS + 500)).toBe(
      10_500,
    );
    // 連打の間隔は受け取った時刻から数える（処理が遅くても次の受付は遅れない）
    expect(state.answerAfter).toBe(receivedAt + 800);
  });

  it("処理時間と猶予のぶん時間切れが遅れる", () => {
    const state = answeredChallenge(
      running(),
      true,
      next,
      START + 10_000,
      START + 10_300,
    );
    expect(isChallengeTimeUp(state, START + LIMIT_MS + 300)).toBe(false);
    expect(
      isChallengeTimeUp(state, START + LIMIT_MS + 300 + RESPONSE_GRACE_MS),
    ).toBe(true);
  });
});

describe("pausedChallenge", () => {
  it("停止中は時計を進めず、再開すると止めた所から数える", () => {
    const paused = pausedChallenge(running(), true, START + 10_000);
    expect(challengeElapsed(paused, START + 50_000)).toBe(10_000);

    const resumed = pausedChallenge(paused, false, START + 50_000);
    expect(challengeElapsed(resumed, START + 55_000)).toBe(15_000);
  });

  it("時間切れと期限切れの後は動かさない", () => {
    expect(canPauseChallenge(running(), START + LIMIT_MS - 1)).toBe(true);
    expect(canPauseChallenge(running(), START + LIMIT_MS)).toBe(false);
    expect(canPauseChallenge(running({ paused: true }), T0 + DAY_MS)).toBe(
      false,
    );
  });
});

describe("finishedChallengeTime", () => {
  it("時間切れにもミス上限にも達していなければ確定しない", () => {
    expect(finishedChallengeTime(running(), START + LIMIT_MS - 1)).toBe(
      undefined,
    );
  });

  it("時間切れちょうどで確定し、所要時間は制限時間を上限にする", () => {
    expect(finishedChallengeTime(running(), START + LIMIT_MS)).toBe(
      rules.timeLimit,
    );
    expect(finishedChallengeTime(running(), START + LIMIT_MS * 2)).toBe(
      rules.timeLimit,
    );
  });

  it("ミス上限に達していれば時間内でも確定し、秒に丸める", () => {
    const state = running({ incorrectAnswers: rules.mistakeLimit });
    expect(finishedChallengeTime(state, START + 12_400)).toBe(12);
    expect(finishedChallengeTime(state, START + 12_500)).toBe(13);
  });

  it("昇級試験は合格点に届いていれば時間内でも確定する", () => {
    expect(
      finishedChallengeTime(
        runningExam({ score: PASS_LINE - 1 }),
        START + 9_000,
      ),
    ).toBe(undefined);
    expect(
      finishedChallengeTime(runningExam({ score: PASS_LINE }), START + 9_000),
    ).toBe(9);
  });

  it("作成から 24 時間を過ぎた行は確定しない", () => {
    const state = running({ incorrectAnswers: rules.mistakeLimit });
    expect(finishedChallengeTime(state, T0 + DAY_MS)).toBe(undefined);
  });
});

describe("isChallengeTimeUp / challengeRemainingMs", () => {
  it("残り時間が 0 になった瞬間を時間切れとする", () => {
    expect(challengeRemainingMs(running(), START + LIMIT_MS - 1)).toBe(1);
    expect(isChallengeTimeUp(running(), START + LIMIT_MS - 1)).toBe(false);
    expect(challengeRemainingMs(running(), START + LIMIT_MS)).toBe(0);
    expect(isChallengeTimeUp(running(), START + LIMIT_MS)).toBe(true);
  });
});

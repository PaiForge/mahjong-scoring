import { describe, expect, it } from "vitest";

import {
  isMobileChallengeErrorCode,
  MOBILE_CHALLENGE_ERROR_CODES,
  MOBILE_CHALLENGES_API_PATH,
  MOBILE_LESSON_COMPLETIONS_API_PATH,
  MOBILE_PROGRESS_API_PATH,
  parseMobileBeginChallengeResponse,
  mobileChallengeApiPath,
  parseMobileAnswerResponse,
  parseMobileChallengeStatus,
  parseMobileCompleteLessonsResponse,
  parseMobileFinishResponse,
  parseMobileProgressResponse,
  parseMobileUnansweredResponse,
} from "./mobile-api";

describe("パス", () => {
  it("チャレンジ・進み具合・レッスンの完了のパス", () => {
    expect(MOBILE_CHALLENGES_API_PATH).toBe("/api/mobile/v1/challenges");
    expect(MOBILE_PROGRESS_API_PATH).toBe("/api/mobile/v1/progress");
    expect(MOBILE_LESSON_COMPLETIONS_API_PATH).toBe(
      "/api/mobile/v1/lessons/complete",
    );
  });
});

describe("isMobileChallengeErrorCode", () => {
  it("失敗の理由は 1 つ以上あり、空の名前も重複も無い", () => {
    expect(MOBILE_CHALLENGE_ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(MOBILE_CHALLENGE_ERROR_CODES).size).toBe(
      MOBILE_CHALLENGE_ERROR_CODES.length,
    );
    for (const code of MOBILE_CHALLENGE_ERROR_CODES) {
      expect(code).not.toBe("");
    }
  });

  it.each(MOBILE_CHALLENGE_ERROR_CODES)(
    "列挙した %s をチャレンジの失敗の理由と認める",
    (code) => {
      expect(isMobileChallengeErrorCode(code)).toBe(true);
    },
  );

  it.each([
    ["知らない理由", "rateLimited"],
    ["空文字", ""],
    ["文字列でない値", 1],
    ["undefined", undefined],
  ])("%s は失敗の理由と認めない", (_label, value) => {
    expect(isMobileChallengeErrorCode(value)).toBe(false);
  });
});

describe("parseMobileProgressResponse", () => {
  it("アプリが知らない練習・段級位は落とし、未知のバリアントは残す", () => {
    const input = parseMobileProgressResponse({
      completedLessonSlugs: ["jantou-fu"],
      attemptedPractices: [
        { slug: "jantou-fu", variant: "retired-variant" },
        { slug: "future-practice", variant: "default" },
      ],
      achievedRankSlugs: ["kyu-5", "future-rank"],
    });

    expect(input).toEqual({
      completedLessonSlugs: new Set(["jantou-fu"]),
      attemptedPractices: [{ slug: "jantou-fu", variant: "retired-variant" }],
      achievedRankSlugs: ["kyu-5"],
    });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileProgressResponse({ completedLessonSlugs: "x" })).toBe(
      undefined,
    );
  });
});

describe("parseMobileBeginChallengeResponse", () => {
  const entry = { id: "a", sequence: 0, question: {} };

  it("合格ラインを読む", () => {
    expect(
      parseMobileBeginChallengeResponse({ ...entry, goalCount: 5 }),
    ).toEqual({ ...entry, goalCount: 5 });
  });

  it("合格ラインの無い応答（練習・古いサーバー）も入口として読み、合格ラインの項目を持たない", () => {
    expect(parseMobileBeginChallengeResponse(entry)).toStrictEqual(entry);
  });

  it.each([
    ["null", null],
    ["文字列", "question"],
    ["数値", 1],
  ])("問題が %s なら入口として読まない", (_label, question) => {
    expect(
      parseMobileBeginChallengeResponse({ ...entry, question }),
    ).toBeUndefined();
  });

  it("形が違う合格ラインは捨て、開始は失敗にしない", () => {
    expect(
      parseMobileBeginChallengeResponse({ ...entry, goalCount: "5" }),
    ).toEqual(entry);
    expect(
      parseMobileBeginChallengeResponse({ ...entry, goalCount: 0 }),
    ).toEqual(entry);
  });

  it("入口の形が違えば undefined", () => {
    expect(parseMobileBeginChallengeResponse({ id: "a" })).toBeUndefined();
  });
});

describe("parseMobileAnswerResponse", () => {
  it("期限切れの応答を読む", () => {
    expect(parseMobileAnswerResponse({ expired: true })).toEqual({
      expired: true,
    });
  });

  it("採点の応答を読む", () => {
    const body = {
      correct: false,
      answered: { prompt: 1 },
      question: { prompt: 2 },
      sequence: 3,
      elapsedMs: 4500,
    };
    expect(parseMobileAnswerResponse(body)).toEqual(body);
  });

  it("採点の応答に欠けた項目があれば undefined", () => {
    expect(parseMobileAnswerResponse({ correct: true })).toBe(undefined);
  });
});

describe("parseMobileChallengeStatus", () => {
  const status = {
    id: "a",
    sequence: 4,
    question: { prompt: 1 },
    menuType: "jantou_fu",
    variant: "default",
    settings: { renfonpaiAs4Fu: true },
    score: 3,
    incorrectAnswers: 1,
    elapsedMs: 12_000,
    remainingMs: 48_000,
    paused: true,
    finished: false,
  };

  it("再開に要る状態を読む", () => {
    expect(parseMobileChallengeStatus(status)).toEqual(status);
  });

  it("項目が欠けていれば undefined", () => {
    const { remainingMs: _remainingMs, ...missing } = status;
    expect(parseMobileChallengeStatus(missing)).toBeUndefined();
  });

  it("出題の設定の形が違えば undefined", () => {
    expect(
      parseMobileChallengeStatus({ ...status, settings: {} }),
    ).toBeUndefined();
  });
});

describe("parseMobileUnansweredResponse", () => {
  it("答えていない問題を読む", () => {
    expect(parseMobileUnansweredResponse({ question: { prompt: 1 } })).toEqual({
      question: { prompt: 1 },
    });
  });

  it("問題の代わりに残り時間が返れば、それを読む", () => {
    expect(parseMobileUnansweredResponse({ remainingMs: 0 })).toEqual({
      remainingMs: 0,
    });
  });

  it("どちらの形でもなければ undefined", () => {
    expect(parseMobileUnansweredResponse({})).toBeUndefined();
    expect(parseMobileUnansweredResponse({ question: null })).toBeUndefined();
  });
});

describe("parseMobileCompleteLessonsResponse", () => {
  it("記録したレッスンと断ったレッスンを読む", () => {
    expect(
      parseMobileCompleteLessonsResponse({
        completed: ["jantou-fu"],
        rejected: ["unknown-lesson"],
      }),
    ).toEqual({ completed: ["jantou-fu"], rejected: ["unknown-lesson"] });
  });

  it("形が違えば undefined", () => {
    expect(
      parseMobileCompleteLessonsResponse({ completed: ["jantou-fu"] }),
    ).toBeUndefined();
  });
});

describe("mobileChallengeApiPath", () => {
  it("ID を URL の 1 区切りとして埋める", () => {
    expect(mobileChallengeApiPath("a/b", "finish")).toBe(
      "/api/mobile/v1/challenges/a%2Fb/finish",
    );
  });
});

describe("parseMobileFinishResponse", () => {
  const exp = {
    earnedExp: 12,
    totalExp: 340,
    level: 3,
    levelUp: false,
    progressPercent: 40,
  };

  it("経験値つきの応答を読む", () => {
    expect(parseMobileFinishResponse({ challengeResultId: "r1", exp })).toEqual(
      { challengeResultId: "r1", exp },
    );
  });

  it("経験値の無い応答（対象外の練習・古いサーバー）も読み、経験値・比較の項目を持たない", () => {
    expect(
      parseMobileFinishResponse({ challengeResultId: "r1" }),
    ).toStrictEqual({
      challengeResultId: "r1",
    });
  });

  it.each(["first", "newBest", "none"])(
    "サーバーが返す記録の状態 %s を比較として読む",
    (status) => {
      const parsed = parseMobileFinishResponse({
        challengeResultId: "r1",
        comparison: { status },
      });
      expect(
        parsed !== undefined && "comparison" in parsed
          ? parsed.comparison?.status
          : undefined,
      ).toBe(status);
    },
  );

  it("経験値の形が違えば応答ごと読まない", () => {
    expect(
      parseMobileFinishResponse({
        challengeResultId: "r1",
        exp: { ...exp, level: "3" },
      }),
    ).toBeUndefined();
  });

  it("過去の記録との比較を読み、JSON で落ちた項目は undefined で埋める", () => {
    expect(
      parseMobileFinishResponse({
        challengeResultId: "r1",
        comparison: { status: "first", currentScore: 7 },
      }),
    ).toEqual({
      challengeResultId: "r1",
      comparison: {
        status: "first",
        currentScore: 7,
        previousBestScore: undefined,
        previousLastScore: undefined,
        diffFromLast: undefined,
      },
    });
  });

  it("比較の形が違えば比較だけを捨て、記録は読む", () => {
    expect(
      parseMobileFinishResponse({
        challengeResultId: "r1",
        exp,
        comparison: { status: "future-status", currentScore: 7 },
      }),
    ).toEqual({ challengeResultId: "r1", exp });
  });

  it("昇級試験の応答は付与した段級位を読み、知らない段級位は落とす", () => {
    expect(
      parseMobileFinishResponse({ grantedRanks: ["kyu-4", "future-rank"] }),
    ).toEqual({ grantedRanks: ["kyu-4"] });
  });

  it("不合格の試験（付与なし）も読む", () => {
    expect(parseMobileFinishResponse({ grantedRanks: [] })).toEqual({
      grantedRanks: [],
    });
  });
});

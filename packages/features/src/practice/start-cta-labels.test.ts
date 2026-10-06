import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildPracticeStartCtaLabels } from "./start-cta-labels";

/** 引いたキーと差し込んだ値をそのまま返す翻訳関数 */
const echo =
  (namespace: string) =>
  (key: string, values?: Record<string, string | number>) =>
    `${namespace}.${key}${values ? JSON.stringify(values) : ""}`;

const t = {
  challenge: echo("challenge"),
  practice: echo("practice"),
  training: echo("training"),
};

describe("buildPracticeStartCtaLabels", () => {
  it("チャレンジの補足に練習のルールを差し込む", () => {
    expect(
      buildPracticeStartCtaLabels(t, { timeLimit: 90, mistakeLimit: 5 })
        .challengeHint,
    ).toBe('practice.modeChallengeHint{"timeLimit":90,"mistakeLimit":5}');
  });

  it("ルールを省くと共通の制限時間とミス上限を使う", () => {
    expect(buildPracticeStartCtaLabels(t)).toEqual({
      challenge: "challenge.startButton",
      challengeHint: `practice.modeChallengeHint${JSON.stringify({
        timeLimit: CHALLENGE_TIME_LIMIT,
        mistakeLimit: MISTAKE_LIMIT,
      })}`,
      training: "training.startButton",
      trainingHint: "practice.modeTrainingHint",
      orDivider: "practice.orDivider",
    });
  });
});

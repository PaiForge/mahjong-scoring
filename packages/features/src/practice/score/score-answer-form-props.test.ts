import { HaiKind, generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { generateOrThrow } from "../../test/generate-or-throw";

import { getAvailableScores } from "./get-available-scores";
import {
  challengeScoreRangeOf,
  scoreAnswerTargetOf,
  scoreChallengeAnswerFormPropsOf,
} from "./score-answer-form-props";

describe("challengeScoreRangeOf", () => {
  it("範囲を渡さない出題は、正解の翻数によらず満貫未満と満貫以上の両方を並べる", () => {
    for (const han of [1, 2, 5, 13]) {
      const available = getAvailableScores({
        han,
        isOya: false,
        isTsumo: false,
        scoreRange: challengeScoreRangeOf(undefined),
      });
      expect(available.type).toBe("single");
      if (available.type !== "single") continue;
      expect(available.scores).toContain(1000);
      expect(available.scores).toContain(8000);
    }
  });

  it("範囲を決めている出題は、その範囲をそのまま使う", () => {
    expect(challengeScoreRangeOf("manganPlus")).toBe("manganPlus");
  });
});

describe("scoreAnswerTargetOf", () => {
  it("自風が東の出題は親として、翻数は正解から取る", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ includeChild: false }),
    );
    expect(question.jikaze).toBe(HaiKind.Ton);
    expect(scoreAnswerTargetOf(question)).toEqual({
      isOya: true,
      isTsumo: question.isTsumo,
      han: question.answer.han,
    });
  });

  it("自風が東以外の出題は子", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ includeParent: false }),
    );
    expect(question.jikaze).not.toBe(HaiKind.Ton);
    expect(scoreAnswerTargetOf(question).isOya).toBe(false);
  });
});

describe("scoreChallengeAnswerFormPropsOf", () => {
  const question = generateOrThrow(() => generateValidScoreQuestion());

  it("チャレンジはルール設定がダブル役満採用でも選択肢を固定し、ダブル役満を足さない", () => {
    const props = scoreChallengeAnswerFormPropsOf({ question }, true);
    expect(props.fixedRules).toBe(true);
    expect(props.allowDoubleYakuman).toBe(false);
    expect(props.autoSubmit).toBe(true);
  });

  it("トレーニングはルール設定に従ってダブル役満を足し、選択肢を固定しない", () => {
    const adopted = scoreChallengeAnswerFormPropsOf(
      { question, isTraining: true },
      true,
    );
    expect(adopted.fixedRules).toBe(false);
    expect(adopted.allowDoubleYakuman).toBe(true);
    const notAdopted = scoreChallengeAnswerFormPropsOf(
      { question, isTraining: true },
      false,
    );
    expect(notAdopted.allowDoubleYakuman).toBe(false);
  });

  it("回答対象は出題から、点数範囲は未指定なら全範囲になる", () => {
    const props = scoreChallengeAnswerFormPropsOf({ question }, false);
    expect(props).toMatchObject(scoreAnswerTargetOf(question));
    expect(props.scoreRange).toBe("all");
    expect(
      scoreChallengeAnswerFormPropsOf(
        { question, scoreRange: "manganPlus" },
        false,
      ).scoreRange,
    ).toBe("manganPlus");
  });
});

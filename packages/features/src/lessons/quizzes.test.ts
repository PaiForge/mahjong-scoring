import { describe, expect, it } from "vitest";

import { choiceKey, isSameChoice } from "./quiz";
import { lessonQuiz } from "./quizzes";
import { LESSON_SLUGS } from "./registry";

describe("lessonQuiz", () => {
  it.each(LESSON_SLUGS)(
    "%s: 問題があり、正解はすべて選択肢に含まれる",
    (slug) => {
      const quiz = lessonQuiz(slug);
      expect(quiz.questions.length).toBeGreaterThan(0);
      for (const question of quiz.questions) {
        expect(
          quiz.choices.some((choice) => isSameChoice(choice, question.answer)),
        ).toBe(true);
      }
    },
  );

  it.each(LESSON_SLUGS)("%s: 選択肢と問題の辞書キーは重複しない", (slug) => {
    const quiz = lessonQuiz(slug);
    const choiceKeys = quiz.choices.map(choiceKey);
    expect(new Set(choiceKeys).size).toBe(choiceKeys.length);
    const questionKeys = quiz.questions.map((question) => question.key);
    expect(new Set(questionKeys).size).toBe(questionKeys.length);
  });

  it("子のロン: 満貫 → 跳満 → 倍満 の 3 問で、翻数と点数が点数表と一致する", () => {
    const quiz = lessonQuiz("mangan-ko-ron");
    expect(quiz.questions).toEqual([
      {
        key: "mangan",
        prompt: { kind: "tier", tierKey: "mangan", han: 5 },
        answer: { kind: "points", points: 8000 },
      },
      {
        key: "haneman",
        prompt: { kind: "tier", tierKey: "haneman", han: 6 },
        answer: { kind: "points", points: 12000 },
      },
      {
        key: "baiman",
        prompt: { kind: "tier", tierKey: "baiman", han: 8 },
        answer: { kind: "points", points: 16000 },
      },
    ]);
    expect(quiz.choices).toEqual(
      [8000, 12000, 16000, 24000, 32000].map((points) => ({
        kind: "points",
        points,
      })),
    );
  });
});

import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  generateChallengeQuestion,
  gradeChallengeAnswer,
  publicChallengeQuestion,
} from "./questions";
import {
  PRACTICE_MENU_TYPES,
  practiceMenuByType,
} from "@mahjong-scoring/features/practice-menu-types";

// 全メニューの生成・JSON往復・正解隠蔽を同じ境界で検証する。
describe("server questions", () => {
  it.each(PRACTICE_MENU_TYPES.map(practiceMenuByType))(
    "$menuType の正解を回答前に返さない",
    (menu) => {
      const question = generateChallengeQuestion(
        menu.menuType,
        menu.variants[0],
        { renfonpaiAs4Fu: false },
      );
      expect(question).toBeDefined();
      if (!question) return;
      const publicQuestion = publicChallengeQuestion(question, menu.menuType);
      if ("choices" in publicQuestion)
        expect(
          publicQuestion.choices.every(
            (choice) => !choice.isCorrect && choice.fu === 0,
          ),
        ).toBe(true);
      if ("items" in publicQuestion)
        expect(publicQuestion.items.every((item) => item.fu === 0)).toBe(true);
      if ("correctHan" in publicQuestion)
        expect(publicQuestion.correctHan).toBe(0);
      if ("correctYakuNames" in publicQuestion)
        expect(publicQuestion.correctYakuNames).toEqual([]);
      if ("correctAnswer" in publicQuestion)
        expect(publicQuestion.correctAnswer).toEqual({ type: "ron", score: 0 });
      if (
        "answer" in publicQuestion &&
        typeof publicQuestion.answer === "object"
      ) {
        expect(publicQuestion.answer).toEqual({
          han: 0,
          fu: 20,
          scoreLevel: "Normal",
          yakumanMultiplier: 0,
          payment: { type: "ron", amount: 0 },
        });
        expect(publicQuestion.fuDetails).toEqual([]);
        if (menu.menuType !== "mangan_score_calculation")
          expect(publicQuestion.yakuDetails).toEqual([]);
      }
      expect(
        gradeChallengeAnswer(menu.menuType, question, {
          score: 1000,
          correct: true,
        }),
      ).toBe(false);
    },
  );
  it("サーバーに保持した答えで選択値を採点する", () => {
    const question = { id: "q", tiles: [], agariHai: 0, answer: 2 } as const;
    expect(gradeChallengeAnswer("machi_fu", question, 2)).toBe(true);
    expect(gradeChallengeAnswer("machi_fu", question, 0)).toBe(false);
    expect(gradeChallengeAnswer("machi_fu", question, "2")).toBe(false);
  });
  it("役の重複送信で不足する役を補えない", () => {
    const question = generateChallengeQuestion("yaku", "default", {
      renfonpaiAs4Fu: false,
    });
    expect(question && "correctYakuNames" in question).toBe(true);
    if (!question || !("correctYakuNames" in question)) return;
    expect(
      gradeChallengeAnswer("yaku", question, question.correctYakuNames),
    ).toBe(true);
    expect(
      gradeChallengeAnswer("yaku", question, [
        ...question.correctYakuNames,
        question.correctYakuNames[0],
      ]),
    ).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeScoreQuestionResult } from "../_lib/__tests__/score-question-result.fixture";
import { ScoreProblemListWithLinks } from "./score-problem-list-with-links";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

describe("ScoreProblemListWithLinks", () => {
  it("正解点数を押すと別ページではなく点数表モーダルを開く", () => {
    render(
      <ScoreProblemListWithLinks
        results={[makeScoreQuestionResult()]}
        translationNamespace="manganExamChallenge"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /No\.1/ }));

    const correctAnswer = screen.getByRole("button", { name: /1000/ });
    expect(correctAnswer.closest("a")).toBeNull();

    fireEvent.click(correctAnswer);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("heading")[0]?.textContent).toBe(
      "pageTitle",
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { messages } from "@mahjong-scoring/messages/ja";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import { ProblemListAccordion } from "./problem-list-accordion";
import { RevealMistakesLink } from "./reveal-mistakes-link";

const originalScrollIntoView = Element.prototype.scrollIntoView;
const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

function show(outcomes: readonly AnswerOutcome[]) {
  return render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      <RevealMistakesLink>不正解を見る</RevealMistakesLink>
      <ProblemListAccordion
        results={outcomes}
        translationNamespace="yaku"
        outcome={(outcome) => outcome}
        renderDetail={(_, index) => <p>詳細 {index + 1}</p>}
      />
    </NextIntlClientProvider>,
  );
}

describe("ProblemListAccordion と RevealMistakesLink", () => {
  it("リンクを押すと不正解と時間切れの問題だけを開き、最初のものへスクロールする", () => {
    show([
      AnswerOutcome.Correct,
      AnswerOutcome.Incorrect,
      AnswerOutcome.Correct,
      AnswerOutcome.TimeUp,
    ]);

    // 既定ではどれも閉じている
    expect(screen.queryByText(/^詳細/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "不正解を見る" }));

    expect(screen.queryByText("詳細 1")).toBeNull();
    expect(screen.getByText("詳細 2")).toBeDefined();
    expect(screen.queryByText("詳細 3")).toBeNull();
    expect(screen.getByText("詳細 4")).toBeDefined();

    const target = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(target.textContent).toContain("No.2");
  });

  it("開いた後も各カードは押して閉じられる", () => {
    show([AnswerOutcome.Incorrect]);

    fireEvent.click(screen.getByRole("button", { name: "不正解を見る" }));
    expect(screen.getByText("詳細 1")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /No\.1/ }));
    expect(screen.queryByText("詳細 1")).toBeNull();
  });

  it("間違えた問題が無ければリンクにならない", () => {
    show([AnswerOutcome.Correct]);

    expect(screen.queryByRole("button", { name: "不正解を見る" })).toBeNull();
    expect(screen.getByText("不正解を見る")).toBeDefined();
  });
});

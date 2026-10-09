import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result.fixture";
import { ScoreProblemListWithLinks } from "./score-problem-list-with-links";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 符の内訳の文字列は features の共有フックが use-intl から引く
vi.mock("use-intl", async () => await import("@/test/intl-mock"));

/** 符の内訳だけを確かめる出題（手牌の再表示はパースできなくてよい） */
const SNAPSHOT_WITH_FU = {
  tehai: "",
  agariHai: "",
  bakaze: "1z",
  jikaze: "2z",
  doraMarkers: [],
  fuDetails: [
    { reason: "副底", fu: 20 },
    { reason: "門前ロン", fu: 10 },
    { reason: "嵌張待ち", fu: 2 },
  ],
};

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

  it("符の内訳を持つ問題は、詳細に閉じた符の内訳を出す", () => {
    render(
      <ScoreProblemListWithLinks
        results={[
          makeScoreQuestionResult({ fu: 40, question: SNAPSHOT_WITH_FU }),
        ]}
        translationNamespace="fuScoreExamChallenge"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /No\.1/ }));

    const toggle = screen.getByRole("button", { name: "breakdownTitle" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("符の内訳を持たない問題（満貫以上・旧データ）では出さない", () => {
    render(
      <ScoreProblemListWithLinks
        results={[makeScoreQuestionResult()]}
        translationNamespace="fuScoreExamChallenge"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /No\.1/ }));

    expect(screen.queryByRole("button", { name: "breakdownTitle" })).toBeNull();
  });
});

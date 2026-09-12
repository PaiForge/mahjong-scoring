import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { generateValidMachiScoreQuestion } from "@mahjong-scoring/core";
import type { MachiScoreQuestion } from "@mahjong-scoring/core";
import { WaitCellGrid } from "./wait-cell-grid";
import { cellKeyOf, type MachiCellRef } from "../_hooks/use-machi-score-store";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("@pai-forge/mahjong-react-ui", () => ({
  Hai: ({ hai }: { hai: number }) => <span data-testid="hai">{hai}</span>,
}));

function seedQuestion(): MachiScoreQuestion {
  const question = generateValidMachiScoreQuestion();
  if (!question) throw new Error("問題を生成できなかった");
  return question;
}

function renderGrid(
  question: MachiScoreQuestion,
  selectedCells: readonly MachiCellRef[],
  onToggleCell = vi.fn(),
) {
  render(
    <WaitCellGrid
      question={question}
      cellAnswers={{}}
      selectedCells={selectedCells}
      formatAnswer={() => ""}
      onToggleCell={onToggleCell}
    />,
  );
  return onToggleCell;
}

describe("WaitCellGrid の選択中の表示", () => {
  it("1 つだけ選んだマスは「回答中」、同じ列の未回答は「同じ回答にする」、他の列は「未回答」のまま", () => {
    const question = seedQuestion();
    renderGrid(question, [
      { agariHai: question.waits[0].agariHai, isTsumo: true },
    ]);

    expect(screen.getAllByRole("button", { name: "answering" })).toHaveLength(
      1,
    );
    expect(
      screen.queryByRole("button", { name: "answeringTogether" }),
    ).toBeNull();
    expect(screen.getAllByRole("button", { name: "joinable" })).toHaveLength(
      question.waits.length - 1,
    );
    expect(screen.getAllByRole("button", { name: "unanswered" })).toHaveLength(
      question.waits.length,
    );
  });

  it("回答済みのマスを選ぶと、回答の文字を残したまま回答中の見た目になる", () => {
    const question = seedQuestion();
    const cell = { agariHai: question.waits[0].agariHai, isTsumo: true };
    render(
      <WaitCellGrid
        question={question}
        cellAnswers={{
          [cellKeyOf(cell)]: {
            kind: "score",
            answer: { han: 1, fu: 30, score: 1000, yakus: [] },
          },
        }}
        selectedCells={[cell]}
        formatAnswer={() => "1翻 30符 1000点"}
        onToggleCell={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "1翻 30符 1000点" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.className).toContain("border-amber-500");
    expect(screen.queryByRole("button", { name: "answering" })).toBeNull();
  });

  it("何も選んでいなければ全マスが「未回答」", () => {
    const question = seedQuestion();
    renderGrid(question, []);

    expect(screen.getAllByRole("button", { name: "unanswered" })).toHaveLength(
      question.waits.length * 2,
    );
    expect(screen.queryByRole("button", { name: "joinable" })).toBeNull();
  });

  it("縦に隣り合う選択中のマスは rowSpan で 1 つにつながり「まとめて回答中」を 1 つだけ出す", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    renderGrid(question, tsumoCells);

    const merged = screen.getByRole("button", { name: "answeringTogether" });
    expect(merged.closest("td")?.rowSpan).toBe(question.waits.length);
    expect(screen.queryByRole("button", { name: "answering" })).toBeNull();
    // ロン列は 1 マスずつ残る
    expect(screen.getAllByRole("button", { name: "unanswered" })).toHaveLength(
      question.waits.length,
    );
  });

  it("塊を押すと塊の全マスの選択が解ける", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    const onToggleCell = renderGrid(question, tsumoCells);

    fireEvent.click(screen.getByRole("button", { name: "answeringTogether" }));

    expect(onToggleCell.mock.calls.map(([cell]) => cellKeyOf(cell))).toEqual(
      tsumoCells.map(cellKeyOf),
    );
  });
});

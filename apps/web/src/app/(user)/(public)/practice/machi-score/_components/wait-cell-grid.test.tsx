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
      screen.queryByRole("group", { name: "answeringTogether" }),
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

    const merged = screen.getByRole("group", { name: "answeringTogether" });
    expect(merged.closest("td")?.rowSpan).toBe(question.waits.length);
    expect(screen.queryByRole("button", { name: "answering" })).toBeNull();
    // ロン列は 1 マスずつ残る
    expect(screen.getAllByRole("button", { name: "unanswered" })).toHaveLength(
      question.waits.length,
    );
  });

  it("選択中の塊は行ごとに押せて、押した行だけ選択から外れる", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    const onToggleCell = renderGrid(question, tsumoCells);

    const rows = screen.getAllByRole("button", { name: /removeFromSelection/ });
    expect(rows).toHaveLength(question.waits.length);
    fireEvent.click(rows[1]);

    expect(onToggleCell.mock.calls.map(([cell]) => cellKeyOf(cell))).toEqual([
      cellKeyOf(tsumoCells[1]),
    ]);
  });

  it("縦に隣り合う回答済みのマスは回答が同じなら 1 つの塊になり、押すと塊ごと選択に入る", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    const onToggleCell = vi.fn();
    // 別々の参照でも中身が同じなら同じ回答
    const cellAnswers = Object.fromEntries(
      tsumoCells.map((cell) => [
        cellKeyOf(cell),
        {
          kind: "score" as const,
          answer: { han: 1, fu: 30, score: 1000, yakus: [] },
        },
      ]),
    );
    render(
      <WaitCellGrid
        question={question}
        cellAnswers={cellAnswers}
        selectedCells={[]}
        formatAnswer={() => "1翻 30符 1000点"}
        onToggleCell={onToggleCell}
      />,
    );

    const merged = screen.getByRole("button", { name: "1翻 30符 1000点" });
    expect(merged.closest("td")?.rowSpan).toBe(question.waits.length);
    expect(merged.className).toContain("border-primary-500");

    fireEvent.click(merged);
    expect(onToggleCell.mock.calls.map(([cell]) => cellKeyOf(cell))).toEqual(
      tsumoCells.map(cellKeyOf),
    );
  });

  it("回答済みでも回答が違えば塊にならない", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    const cellAnswers = Object.fromEntries(
      tsumoCells.map((cell, i) => [
        cellKeyOf(cell),
        {
          kind: "score" as const,
          answer: { han: i + 1, fu: 30, score: 1000 * (i + 1), yakus: [] },
        },
      ]),
    );
    render(
      <WaitCellGrid
        question={question}
        cellAnswers={cellAnswers}
        selectedCells={[]}
        formatAnswer={(answer) =>
          answer.kind === "score" ? `${answer.answer.han}翻` : "役なし"
        }
        onToggleCell={vi.fn()}
      />,
    );

    for (let i = 0; i < question.waits.length; i++) {
      const cell = screen.getByRole("button", { name: `${i + 1}翻` });
      expect(cell.closest("td")?.rowSpan).toBe(1);
    }
  });

  it("回答済みの塊を選び直すと、回答の文字を残したまま琥珀の塊になる", () => {
    const question = seedQuestion();
    const tsumoCells = question.waits.map((wait) => ({
      agariHai: wait.agariHai,
      isTsumo: true,
    }));
    const answer = {
      kind: "score" as const,
      answer: { han: 1, fu: 30, score: 1000, yakus: [] },
    };
    render(
      <WaitCellGrid
        question={question}
        cellAnswers={Object.fromEntries(
          tsumoCells.map((cell) => [cellKeyOf(cell), answer]),
        )}
        selectedCells={tsumoCells}
        formatAnswer={() => "1翻 30符 1000点"}
        onToggleCell={vi.fn()}
      />,
    );

    const group = screen.getByRole("group", { name: "1翻 30符 1000点" });
    expect(group.className).toContain("border-amber-500");
    expect(
      screen.queryByRole("group", { name: "answeringTogether" }),
    ).toBeNull();
    expect(
      screen.getAllByRole("button", { name: /removeFromSelection/ }),
    ).toHaveLength(question.waits.length);
  });
});

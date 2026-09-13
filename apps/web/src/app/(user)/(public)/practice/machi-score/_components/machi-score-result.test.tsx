import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type {
  JudgementResult,
  MachiCellAnswer,
  MachiCellJudgementMode,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import {
  generateValidMachiScoreQuestion,
  judgeMachiCellAnswer,
} from "@mahjong-scoring/core";
import { MachiScoreResult } from "./machi-score-result";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "../_hooks/use-machi-score-store";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("@pai-forge/mahjong-react-ui", () => ({
  Hai: ({ hai }: { hai: number }) => <span data-testid="hai">{hai}</span>,
  Furo: () => <span data-testid="furo" />,
}));

const MODE: MachiCellJudgementMode = {
  requireYaku: false,
  simplifyMangan: false,
  requireFuForMangan: false,
  allowDoubleYakuman: false,
};

/**
 * 2 面待ちの出題で、2 つ目の待ちのツモ・ロンを 1 つ目と同じ出題に差し替えた
 * もの。正解と内訳が同じマスを確実に作るため（生成器の出題では待ちごとに
 * 点数が違うことが多い）
 */
function seedTwinQuestion(): MachiScoreQuestion {
  for (let i = 0; i < 200; i++) {
    const question = generateValidMachiScoreQuestion();
    if (!question || question.waits.length !== 2) continue;
    const [first, second] = question.waits;
    return {
      ...question,
      waits: [first, { ...first, agariHai: second.agariHai }],
    };
  }
  throw new Error("2 面待ちの問題を生成できなかった");
}

const SAME_ANSWER: MachiCellAnswer = {
  kind: "score",
  answer: { han: 1, fu: 30, score: 1000, yakus: [] },
};

function renderResult(
  question: MachiScoreQuestion,
  answerOf: (cell: MachiCellRef) => MachiCellAnswer,
) {
  const cellAnswers: Record<string, MachiCellAnswer> = {};
  const cellResults: Record<string, JudgementResult> = {};
  for (const cell of listCellRefs(question)) {
    const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
    if (!wait) throw new Error("待ちが無い");
    const answer = answerOf(cell);
    cellAnswers[cellKeyOf(cell)] = answer;
    cellResults[cellKeyOf(cell)] = judgeMachiCellAnswer(
      cell.isTsumo ? wait.tsumo : wait.ron,
      answer,
      MODE,
    );
  }
  render(
    <MachiScoreResult
      question={question}
      machiJudgement={undefined}
      cellAnswers={cellAnswers}
      cellResults={cellResults}
      formatAnswer={(answer) =>
        answer.kind === "score" ? `${answer.answer.han}翻` : "役なし"
      }
      requireYaku={false}
      simplifyMangan={false}
      requireFuForMangan={false}
      onNext={vi.fn()}
    />,
  );
}

/** 待ちごとの結果の表（最初の table）のマスのボタン */
function summaryCells() {
  const table = screen.getAllByRole("table")[0];
  return Array.from(table.querySelectorAll("tbody button"));
}

describe("MachiScoreResult の塊", () => {
  it("正解・内訳・回答がすべて同じで縦に隣り合うマスは 1 つの塊になり、塊の内訳には和了牌ごとの面子分解が並ぶ", () => {
    const question = seedTwinQuestion();
    renderResult(question, () => SAME_ANSWER);

    // ツモ列・ロン列とも 2 マスが 1 つずつの塊になる
    const cells = summaryCells();
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      expect(cell.closest("td")?.rowSpan).toBe(2);
    }

    // 塊の内訳: 面子分解リンクが和了牌の数だけ、牌付きで並ぶ（牌は各マスの
    // 出題の和了牌。差し替えた出題は 1 つ目の和了牌を持つので値は比べない）
    const links = screen.getAllByRole("button", { name: /mentsuBreakdown/ });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.querySelector("[data-testid=hai]")).not.toBeNull();
    }
  });

  it("正解が同じでも自分の回答が違えばマスは分かれ、内訳の面子分解は 1 つで牌を添えない", () => {
    const question = seedTwinQuestion();
    const [, second] = question.waits;
    renderResult(question, (cell) =>
      cell.agariHai === second.agariHai
        ? { kind: "score", answer: { ...SAME_ANSWER.answer, han: 2 } }
        : SAME_ANSWER,
    );

    const cells = summaryCells();
    expect(cells).toHaveLength(4);
    expect(cells.every((cell) => cell.closest("td")?.rowSpan === 1)).toBe(true);

    const links = screen.getAllByRole("button", { name: /mentsuBreakdown/ });
    expect(links).toHaveLength(1);
    expect(links[0].querySelector("[data-testid=hai]")).toBeNull();
  });

  it("塊を押すと塊全体が選ばれ、別の塊を押すと移る", () => {
    const question = seedTwinQuestion();
    renderResult(question, () => SAME_ANSWER);

    const [tsumoRun, ronRun] = summaryCells();
    expect(tsumoRun.getAttribute("aria-pressed")).toBe("true");
    expect(ronRun.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(ronRun);
    expect(tsumoRun.getAttribute("aria-pressed")).toBe("false");
    expect(ronRun.getAttribute("aria-pressed")).toBe("true");
  });
});

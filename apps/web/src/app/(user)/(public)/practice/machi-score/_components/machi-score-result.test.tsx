import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type {
  JudgementResult,
  MachiCellAnswer,
  MachiCellJudgementMode,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import {
  HaiKind,
  generateValidMachiScoreQuestion,
  judgeMachiCellAnswer,
  judgeMachiSelection,
} from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { MachiScoreResult } from "./machi-score-result";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "../_hooks/use-machi-score-store";
import { correctCellAnswerOf } from "../_lib/format-cell-answer";

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

/** 回答の行分け（本物の整形は使わず、翻数の行と点数の行にする） */
function formatLinesForTest(answer: MachiCellAnswer): readonly string[] {
  return answer.kind === "score"
    ? [`${answer.answer.han}翻`, `${answer.answer.score ?? "-"}点`]
    : ["役なし"];
}

/**
 * 結果を描く
 *
 * @param selectedMachi - 選んだ待ち牌。渡すとその判定付きで描く（渡さない
 *   ときは「わからない」での開示と同じく判定なし）
 */
function renderResult(
  question: MachiScoreQuestion,
  answerOf: (cell: MachiCellRef) => MachiCellAnswer,
  selectedMachi: readonly HaiKindId[] = [],
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
      selectedMachi={selectedMachi}
      machiJudgement={
        selectedMachi.length > 0
          ? judgeMachiSelection(question, selectedMachi)
          : undefined
      }
      cellAnswers={cellAnswers}
      cellResults={cellResults}
      formatAnswerLines={formatLinesForTest}
      requireYaku={false}
      simplifyMangan={false}
      requireFuForMangan={false}
      onNext={vi.fn()}
    />,
  );
}

/** 待ち牌の表（あなたの回答 / 正解）の 2 つのセル */
function machiCells() {
  const row = screen.getAllByRole("table")[0].querySelector("tbody tr");
  if (!row) throw new Error("待ち牌の行が無い");
  const [answer, correct] = Array.from(row.querySelectorAll("td"));
  return { answer, correct };
}

/** セルに並ぶ牌種 ID */
function haiIdsIn(cell: Element): readonly number[] {
  return Array.from(cell.querySelectorAll("[data-testid=hai]")).map((el) =>
    Number(el.textContent),
  );
}

/** マスの正解の回答 */
function correctAnswerFor(
  question: MachiScoreQuestion,
  cell: MachiCellRef,
): MachiCellAnswer {
  const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
  if (!wait) throw new Error("待ちが無い");
  return correctCellAnswerOf(cell.isTsumo ? wait.tsumo : wait.ron);
}

/** 必ず不正解になる回答（正解の翻を 1 つずらす） */
function wrongAnswerFor(correct: MachiCellAnswer): MachiCellAnswer {
  return correct.kind === "score"
    ? {
        kind: "score",
        answer: { ...correct.answer, han: correct.answer.han + 1 },
      }
    : SAME_ANSWER;
}

describe("MachiScoreResult の待ち牌", () => {
  it("あなたの回答と正解を並べ、余分に選んだ牌と見落とした牌に印を付ける", () => {
    const question = seedTwinQuestion();
    const waits = question.waits.map((wait) => wait.agariHai);
    // 待ちではない牌を 1 つ選び、待ちの 2 つ目を選び落とした回答
    const notAWait = Object.values(HaiKind).find((hai) => !waits.includes(hai));
    if (notAWait === undefined) throw new Error("待ちでない牌が無い");
    renderResult(question, () => SAME_ANSWER, [waits[0], notAWait]);

    const { answer, correct } = machiCells();
    // 回答の列は選んだ牌を牌の順に並べ、正解の列は出題の待ちをすべて出す
    expect(haiIdsIn(answer)).toEqual(
      [waits[0], notAWait].sort((a, b) => a - b),
    );
    expect(haiIdsIn(correct)).toEqual(waits);

    // 余分な牌は回答の列で赤、見落とした牌は正解の列で緑の破線
    const frameOf = (cell: Element, hai: HaiKindId) =>
      Array.from(cell.querySelectorAll("[data-testid=hai]")).find(
        (el) => Number(el.textContent) === hai,
      )?.parentElement?.className ?? "";
    expect(frameOf(answer, notAWait)).toContain("border-destructive");
    expect(frameOf(answer, waits[0])).toContain("border-success");
    expect(frameOf(correct, waits[1])).toContain("border-dashed");
    expect(frameOf(correct, waits[0])).toContain("border-transparent");

    // 回答の側に不正解の印が付く（全体の正誤を名乗る文は置かない）
    expect(answer.querySelector('[aria-label="incorrect"]')).not.toBeNull();
  });

  it("「わからない」で開示したときは回答の列を未回答にして正解だけを出す", () => {
    const question = seedTwinQuestion();
    renderResult(question, () => SAME_ANSWER);

    const { answer, correct } = machiCells();
    expect(answer.textContent).toBe("result.unanswered");
    expect(haiIdsIn(correct)).toEqual(question.waits.map((w) => w.agariHai));
    expect(correct.querySelector(".border-dashed")).toBeNull();
  });
});

describe("MachiScoreResult のタブ", () => {
  it("マスごとにタブを出し、外したマスにだけ不正解の印を付ける", () => {
    const question = seedTwinQuestion();
    const [, target] = listCellRefs(question);
    renderResult(question, (cell) => {
      const correct = correctAnswerFor(question, cell);
      return cellKeyOf(cell) === cellKeyOf(target)
        ? wrongAnswerFor(correct)
        : correct;
    });

    expect(screen.getAllByRole("tab")).toHaveLength(question.waits.length * 2);
    expect(screen.getAllByRole("tab", { name: /incorrect/ })).toHaveLength(1);
  });

  it("タブに正解の点数を行ごとに添え、読み上げ名にも含める", () => {
    const question = seedTwinQuestion();
    const cells = listCellRefs(question);
    renderResult(question, () => SAME_ANSWER);

    const tabs = screen.getAllByRole("tab");
    for (const [i, tab] of tabs.entries()) {
      const lines = formatLinesForTest(correctAnswerFor(question, cells[i]));
      const spans = Array.from(tab.querySelectorAll("span")).map(
        (span) => span.textContent,
      );
      for (const line of lines) {
        expect(spans).toContain(line);
        expect(tab.getAttribute("aria-label")).toContain(line);
      }
    }
  });

  it("タブを押すと内訳がそのタブのものに変わる", () => {
    const question = seedTwinQuestion();
    renderResult(question, (cell) => correctAnswerFor(question, cell));

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      tabs[0].id,
    );

    fireEvent.click(tabs[2]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      tabs[2].id,
    );
  });

  it("矢印キーで隣のタブへ移り、端では反対の端へ回る", () => {
    const question = seedTwinQuestion();
    renderResult(question, (cell) => correctAnswerFor(question, cell));

    const tabs = screen.getAllByRole("tab");
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(tabs[tabs.length - 1].getAttribute("aria-selected")).toBe("true");
  });
});

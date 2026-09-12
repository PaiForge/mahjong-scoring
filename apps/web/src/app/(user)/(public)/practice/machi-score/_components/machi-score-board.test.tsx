import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { MachiScoreBoard } = await import("./machi-score-board");
const { useMachiScoreStore } = await import("../_hooks/use-machi-score-store");

/** 盤面を mount し、待ちを正解して点数の回答（cells）まで進める */
async function visitCells() {
  await act(async () => {
    render(<MachiScoreBoard />);
  });
  const store = useMachiScoreStore.getState();
  const question = store.currentQuestion;
  if (!question) throw new Error("問題が無い");
  act(() => {
    for (const wait of question.waits) store.toggleMachi(wait.agariHai);
    useMachiScoreStore.getState().submitMachi();
    useMachiScoreStore.getState().proceedToCells();
  });
  return question;
}

/** 表の 1 行目のマス（ツモ・ロンの順） */
function firstRowCells() {
  const row = screen.getAllByRole("row")[1];
  return Array.from(row.querySelectorAll("button"));
}

/**
 * 見えている回答欄の翻の select。欄はツモ・ロンの 2 つが hidden で常に
 * mount されているので、hidden の外にあるものだけを引く
 */
function visibleHanSelects() {
  return screen
    .getAllByLabelText("form.labels.han")
    .filter((el) => el.closest("[hidden]") === null) as HTMLSelectElement[];
}
function hanSelect() {
  const [select, ...rest] = visibleHanSelects();
  if (!select || rest.length > 0)
    throw new Error("見えている回答欄が 1 つでない");
  return select;
}

const submitButton = () => screen.getByRole("button", { name: "cells.submit" });

describe("MachiScoreBoard の回答欄", () => {
  beforeEach(() => {
    cleanup();
    useMachiScoreStore.getState().setQuestion(undefined);
  });

  it("マスを選ぶまで回答欄は見えず、選んでいる間は「回答する」を押せない", async () => {
    await visitCells();
    expect(visibleHanSelects()).toHaveLength(0);

    fireEvent.click(firstRowCells()[0]);
    expect(hanSelect()).toBeDefined();
    expect(submitButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("cells.selecting")).toBeDefined();
  });

  it("選択を解いても入力は残り、選び直すと同じ入力のまま欄が戻る", async () => {
    await visitCells();
    const [tsumo] = firstRowCells();

    fireEvent.click(tsumo);
    fireEvent.change(hanSelect(), { target: { value: "2" } });

    // 解く（誤タップ）→ 欄は隠れる
    fireEvent.click(tsumo);
    expect(visibleHanSelects()).toHaveLength(0);

    // 選び直す → 入力はそのまま
    fireEvent.click(tsumo);
    expect(hanSelect().value).toBe("2");
  });

  it("別の列を押しても元の列の入力は残り、列ごとに別々に持つ", async () => {
    await visitCells();
    const [tsumo, ron] = firstRowCells();

    fireEvent.click(tsumo);
    fireEvent.change(hanSelect(), { target: { value: "2" } });

    // ロンへ → ロンの欄は空
    fireEvent.click(ron);
    expect(hanSelect().value).toBe("");
    fireEvent.change(hanSelect(), { target: { value: "3" } });

    // ツモへ戻る → ツモの入力が残っている
    fireEvent.click(tsumo);
    expect(hanSelect().value).toBe("2");
    fireEvent.click(ron);
    expect(hanSelect().value).toBe("3");
  });

  it("3 面待ち以上でツモ列をまとめて当てはめると、当てはめた後も 1 つの塊のまま", async () => {
    await visitCells();
    // 3 面待ち以上が出るまで作り直す
    for (let i = 0; i < 60; i++) {
      const q = useMachiScoreStore.getState().currentQuestion;
      if (q && q.waits.length >= 3) break;
      act(() => {
        useMachiScoreStore.getState().nextQuestion();
      });
      const store = useMachiScoreStore.getState();
      const question = store.currentQuestion;
      if (!question) throw new Error("問題が無い");
      act(() => {
        for (const wait of question.waits) store.toggleMachi(wait.agariHai);
        useMachiScoreStore.getState().submitMachi();
        useMachiScoreStore.getState().proceedToCells();
      });
    }
    const question = useMachiScoreStore.getState().currentQuestion;
    if (!question || question.waits.length < 3) {
      throw new Error("3 面待ち以上の問題を作れなかった");
    }

    // ツモ列を全部選ぶ（1 行目のツモ → 残りは「同じ回答にする」）
    fireEvent.click(firstRowCells()[0]);
    for (const joinable of screen.getAllByRole("button", {
      name: "joinable",
    })) {
      fireEvent.click(joinable);
    }
    expect(
      screen.getByRole("group", { name: "answeringTogether" }).closest("td")
        ?.rowSpan,
    ).toBe(question.waits.length);

    act(() => {
      useMachiScoreStore.getState().assignAnswer({
        kind: "score",
        answer: {
          han: 2,
          fu: 30,
          scoreFromKo: 300,
          scoreFromOya: 500,
          yakus: [],
        },
      });
    });

    // 当てはめた後も塊は割れず、回答の文字（支払い）が 1 つだけ出る
    const answered = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("300/500"));
    expect(answered).toHaveLength(1);
    expect(answered[0].closest("td")?.rowSpan).toBe(question.waits.length);
  });

  it("当てはめると、その列の欄は空に戻る", async () => {
    await visitCells();
    const [tsumo] = firstRowCells();

    fireEvent.click(tsumo);
    fireEvent.change(hanSelect(), { target: { value: "2" } });
    act(() => {
      useMachiScoreStore.getState().assignAnswer({
        kind: "score",
        answer: {
          han: 2,
          fu: 30,
          scoreFromKo: 500,
          scoreFromOya: 1000,
          yakus: [],
        },
      });
    });

    fireEvent.click(firstRowCells()[0]);
    expect(hanSelect().value).toBe("");
  });
});

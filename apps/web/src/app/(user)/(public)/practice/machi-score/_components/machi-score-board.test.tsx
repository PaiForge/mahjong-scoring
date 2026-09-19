import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MachiScoreQuestion } from "@mahjong-scoring/core";
import { isOya } from "@mahjong-scoring/core";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { MachiScoreBoard } = await import("./machi-score-board");
const { cellKeyOf, useMachiScoreStore } =
  await import("../_hooks/use-machi-score-store");

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

/**
 * 盤面を mount し、待ちが minWaits 面以上（子の出題に限るなら koOnly）の
 * 問題で点数の回答（cells）まで進める
 */
async function visitCellsWithWaits(minWaits: number, koOnly = false) {
  await visitCells();
  const fits = (q: MachiScoreQuestion) =>
    q.waits.length >= minWaits && (!koOnly || !isOya(q.jikaze));
  // 条件に合う問題が出るまで作り直す
  for (let i = 0; i < 100; i++) {
    const q = useMachiScoreStore.getState().currentQuestion;
    if (q && fits(q)) break;
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
  if (!question || !fits(question)) {
    throw new Error(`${minWaits} 面待ち以上の問題を作れなかった`);
  }
  return question;
}

/** 表の n 行目（1 = 1 つ目の待ち。0 は見出し行）のマス（ツモ・ロンの順） */
function rowCells(index: number) {
  const row = screen.getAllByRole("row")[index];
  return Array.from(row.querySelectorAll("button"));
}

/** 表の 1 行目のマス（ツモ・ロンの順） */
function firstRowCells() {
  return rowCells(1);
}

/**
 * 見えている回答欄の select をラベルで引く。欄はツモ・ロンの 2 つが hidden で
 * 常に mount されているので、hidden の外にあるものだけを引く
 */
function visibleSelects(label: string) {
  return screen
    .getAllByLabelText(label)
    .filter((el) => el.closest("[hidden]") === null) as HTMLSelectElement[];
}
function visibleHanSelects() {
  return visibleSelects("form.labels.han");
}
function visibleSelect(label: string) {
  const [select, ...rest] = visibleSelects(label);
  if (!select || rest.length > 0)
    throw new Error("見えている回答欄が 1 つでない");
  return select;
}
function hanSelect() {
  return visibleSelect("form.labels.han");
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
    expect(screen.getByText("cells.remaining")).toBeDefined();
  });

  it("当てはめると同じ列の次の未回答のマスが続けて回答中になり、欄が入れ替わらない", async () => {
    const question = await visitCells();

    fireEvent.click(firstRowCells()[0]);
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

    // 2 行目のツモ（同じ列の次の未回答）が回答中になり、ツモの欄が出たまま
    expect(useMachiScoreStore.getState().selectedCells).toEqual([
      { agariHai: question.waits[1].agariHai, isTsumo: true },
    ]);
    expect(rowCells(2)[0].getAttribute("aria-pressed")).toBe("true");
    expect(visibleHanSelects()).toHaveLength(1);
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
    const question = await visitCellsWithWaits(3);

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

    // 続けて回答中になった 2 行目のツモの欄（同じ列）が空
    expect(rowCells(2)[0].getAttribute("aria-pressed")).toBe("true");
    expect(hanSelect().value).toBe("");
  });

  it("回答済みのマスを選び直すと、欄にその回答が入る（符だけ直すのに入れ直さない）", async () => {
    await visitCellsWithWaits(2, true);
    const [tsumo] = firstRowCells();

    fireEvent.click(tsumo);
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

    // 2 行目（未回答・回答中）を外して 1 行目（回答済み）だけを選ぶ
    fireEvent.click(rowCells(2)[0]);
    fireEvent.click(firstRowCells()[0]);
    expect(hanSelect().value).toBe("2");
    expect(visibleSelect("form.labels.fu").value).toBe("30");
  });

  it("まとめて答えた塊を押して 3 つめと一緒に選ぶと、欄にその回答が入り、当てはめるだけで 3 マスが 1 枚になる", async () => {
    const question = await visitCellsWithWaits(3, true);

    // 1・2 行目のツモをまとめて 2000/3900 で当てはめる → 3 行目のツモが回答中
    fireEvent.click(rowCells(1)[0]);
    fireEvent.click(rowCells(2)[0]);
    const shared = {
      han: 4,
      fu: 30,
      scoreFromKo: 2000,
      scoreFromOya: 3900,
      yakus: [],
    };
    act(() => {
      useMachiScoreStore.getState().assignAnswer({
        kind: "score",
        answer: shared,
      });
    });
    expect(hanSelect().value).toBe("");

    // 塊（1・2 行目）を押す → 3 行目と一緒に「まとめて回答中」になり、
    // 欄には塊の回答が入っている
    const run = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("2000/3900"));
    if (!run) throw new Error("回答済みの塊が無い");
    fireEvent.click(run);
    expect(
      screen.getByRole("group", { name: "answeringTogether" }).closest("td")
        ?.rowSpan,
    ).toBe(3);
    expect(hanSelect().value).toBe("4");
    expect(visibleSelect("form.placeholders.fromKo").value).toBe("2000");

    // 入れ直さずに当てはめる → 3 マスが 1 枚の塊になる
    fireEvent.click(screen.getByRole("button", { name: "cells.assign" }));
    const cells = useMachiScoreStore.getState().cellAnswers;
    for (const wait of question.waits.slice(0, 3)) {
      expect(
        cells[cellKeyOf({ agariHai: wait.agariHai, isTsumo: true })],
      ).toEqual({ kind: "score", answer: shared });
    }
    const answered = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("2000/3900"));
    expect(answered).toHaveLength(1);
    expect(answered[0].closest("td")?.rowSpan).toBe(3);
  });

  it("入力の途中で回答済みのマスを押しても、入れかけの内容は置き換わらない", async () => {
    await visitCells();
    const [tsumo] = rowCells(1);

    // 1 行目のツモを当てはめる → 2 行目のツモが回答中
    fireEvent.click(tsumo);
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

    // 2 行目に別の翻を入れかけてから、1 行目（回答済み）を誤タップ
    fireEvent.change(hanSelect(), { target: { value: "3" } });
    fireEvent.click(rowCells(1)[0]);
    expect(hanSelect().value).toBe("3");
  });
});

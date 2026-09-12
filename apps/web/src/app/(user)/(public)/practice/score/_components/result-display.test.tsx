import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
} from "@mahjong-scoring/core";
import { ResultDisplay } from "./result-display";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

/**
 * 白・混一色・三暗刻が成立した子のロン（メンツモを1つ余分に選んだ回答）。
 * 早見表に載る役（混一色）・カードがまとめられている役（役牌 白）・
 * 早見表に載らない状況役（門前清自摸和）が1問に揃う。
 */
const question = {
  tehai: { closed: [], exposed: [] },
  agariHai: 0,
  isTsumo: false,
  jikaze: 28,
  bakaze: 27,
  doraMarkers: [],
  answer: {
    han: 6,
    fu: 40,
    scoreLevel: "Normal",
    payment: { type: "ron", amount: 12000 },
  },
  yakuDetails: [
    { name: "役牌 白", han: 1 },
    { name: "混一色", han: 3 },
    { name: "三暗刻", han: 2 },
  ],
  fuDetails: [],
} as unknown as ScoreQuestion;

const userAnswer: UserAnswer = {
  han: 6,
  fu: 40,
  score: 12000,
  yakus: ["門前清自摸和", "役牌 白", "混一色", "三暗刻"],
};

const result: JudgementResult = {
  isCorrect: false,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: false,
};

function renderResult() {
  return render(
    <ResultDisplay
      question={question}
      userAnswer={userAnswer}
      result={result}
      onNext={() => {}}
      requireYaku
    />,
  );
}

/**
 * 開いているモーダルの見出し（intl モックは翻訳キーをそのまま返す）
 *
 * 中身にも見出しが並ぶ（役一覧の翻数セクション等）ため、先頭＝モーダル自身の
 * 見出しを見る。
 */
function openedModalTitle(): string | undefined {
  const dialog = screen.queryByRole("dialog");
  if (!dialog) return undefined;
  return within(dialog).getAllByRole("heading")[0]?.textContent ?? undefined;
}

describe("ResultDisplay", () => {
  it("最初はモーダルを開かない", () => {
    renderResult();

    expect(openedModalTitle()).toBeUndefined();
  });

  it("役をタップすると役一覧モーダルが開く", () => {
    renderResult();

    fireEvent.click(screen.getAllByText("混一色")[0]!);

    expect(openedModalTitle()).toBe("title");
  });

  it("牌まで含んだ役牌もタップできる（早見表の「役牌」へ寄せる）", () => {
    renderResult();

    fireEvent.click(screen.getAllByText("役牌 白")[0]!);

    expect(openedModalTitle()).toBe("title");
  });

  it("早見表に載らない状況役はタップ対象にしない", () => {
    renderResult();

    const chip = screen.getByText("門前清自摸和");

    expect(chip.tagName).toBe("SPAN");
  });

  it("正解の点数をタップすると点数表モーダルが開く", () => {
    renderResult();

    // 回答側にも同じ点数が出るので、押せる正解側（button）を選ぶ
    const correctScore = screen
      .getAllByText(/12000/)
      .find((el) => el.tagName === "BUTTON");

    fireEvent.click(correctScore!);

    expect(openedModalTitle()).toBe("pageTitle");
  });
});

describe("ResultDisplay の無回答", () => {
  it("開示でも「あなたの回答」列を残し、各行に未回答の印を出す（正解の列が動かない）", () => {
    render(<ResultDisplay question={question} requireYaku />);

    expect(
      screen.getByRole("columnheader", { name: "result.headers.answer" }),
    ).toBeTruthy();
    // 役・翻数・符・点数の 4 行
    expect(screen.getAllByText("result.unanswered")).toHaveLength(4);
  });

  it("answerSummary は翻数の行に ✗ 付きで出し、他の行は未回答のまま", () => {
    render(<ResultDisplay question={question} answerSummary="役なし" />);

    expect(screen.getByText("役なし ✗")).toBeTruthy();
    // 符・点数の 2 行
    expect(screen.getAllByText("result.unanswered")).toHaveLength(2);
  });
});

describe("ResultDisplay の内訳", () => {
  it("翻数の内訳は他の練習と同じ器で閉じた状態から始まり、見出しを押すと開く", () => {
    renderResult();

    const toggle = screen.getByRole("button", {
      name: "result.details.yakuTitle",
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("result.details.total")).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("result.details.total")).toBeTruthy();
  });
});

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { HanCountBoard } = await import("./han-count-board");
const { TrainingModeProvider } = await import("../../_hooks/use-training-mode");

/** 役を持つ出題を1つ作る（内訳が空だと表そのものが出ないため） */
function questionWithYaku(): ScoreQuestion {
  for (let i = 0; i < 100; i += 1) {
    const question = generateValidScoreQuestion();
    if (question && (question.yakuDetails?.length ?? 0) > 0) return question;
  }
  throw new Error("役を持つ出題を作れなかった");
}

/**
 * @param holding トレーニングの回答後の停止中として描くか。
 *   省略するとコンテキストごと与えず、チャレンジと同じ条件になる
 */
function renderBoard(question: ScoreQuestion, holding?: boolean) {
  const board = (
    <HanCountBoard
      question={question}
      questionIndex={0}
      advanceQuestion={() => {}}
      showFeedback
      onAnswer={() => {}}
    />
  );

  if (holding === undefined) return render(board);

  return render(
    <TrainingModeProvider
      value={{
        isRevealed: false,
        isHolding: holding,
        registerAdvance: () => {},
      }}
    >
      {board}
    </TrainingModeProvider>,
  );
}

describe("HanCountBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("チャレンジでは翻数の内訳を出さない（読ませる間もタイマーが進むため）", () => {
    renderBoard(questionWithYaku());

    expect(screen.queryByRole("button", { name: "title" })).toBeNull();
  });

  it("トレーニングの答え合わせでは、選択肢の下に閉じた内訳が出る", () => {
    const question = questionWithYaku();
    renderBoard(question, true);

    const toggle = screen.getByRole("button", { name: "title" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    // 選択肢グリッドより後ろ＝上の手牌と選択肢の色を動かさずに下へ伸びる
    const buttons = screen.getAllByRole("button");
    expect(buttons[buttons.length - 1]).toBe(toggle);

    const yakuName = question.yakuDetails?.[0]?.name ?? "";
    expect(screen.queryByText(yakuName)).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(yakuName)).toBeTruthy();
  });

  it("回答前は内訳を出さない（答えの先出しになるため）", () => {
    renderBoard(questionWithYaku(), false);

    expect(screen.queryByRole("button", { name: "title" })).toBeNull();
  });
});

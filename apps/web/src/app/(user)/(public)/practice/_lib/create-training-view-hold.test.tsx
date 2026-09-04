import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
// チャレンジ側のファクトリが Server Action を参照するため、
// クライアントから import できるようスタブに差し替える（トレーニングでは未使用）。
vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

import { ChallengeSubmitButton } from "../_components/challenge-submit-button";
import { useRegisterAdvance } from "../_hooks/use-training-mode";
import { createTrainingView } from "./create-challenge-views";

/**
 * トレーニングは練習の種類を問わず、回答したら正解表示を出したまま止まる。
 * 盤面の中身ではなく、ファクトリ・シェル・送信ボタンの取り合わせだけを検証する。
 */
function renderTrainingView(advance: () => void) {
  function Board({
    showFeedback,
    onAnswer,
  }: {
    readonly showFeedback: boolean;
    readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  }) {
    useRegisterAdvance(advance);
    return (
      <div>
        <div>board feedback:{String(showFeedback)}</div>
        <ChallengeSubmitButton
          disabled={showFeedback}
          onClick={() => onAnswer(true, advance)}
        >
          submit
        </ChallengeSubmitButton>
      </div>
    );
  }

  const TrainingView = createTrainingView({
    slug: "han-count",
    renderBoard: ({ showFeedback, onAnswer }) => (
      <Board showFeedback={showFeedback} onAnswer={onAnswer} />
    ),
  });

  return render(<TrainingView />);
}

describe("createTrainingView 回答後の停止", () => {
  it("回答しても自動では進まず、「次の問題へ」で進む", () => {
    const advance = vi.fn();
    renderTrainingView(advance);

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    // 答え合わせの時間を奪わないため、正解表示を出したまま止まる
    expect(advance).not.toHaveBeenCalled();
    expect(screen.getByText(/board feedback:true/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));

    expect(advance).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/board feedback:false/)).toBeTruthy();
  });

  it("停止中は回答ボタンを引っ込める（「次の問題へ」と二段に並ばない）", () => {
    renderTrainingView(vi.fn());

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(screen.queryByRole("button", { name: "submit" })).toBeNull();
  });
});

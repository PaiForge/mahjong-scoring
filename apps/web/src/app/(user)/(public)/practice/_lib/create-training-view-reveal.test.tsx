import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// チャレンジ側のファクトリが Server Action を参照するため、
// クライアントから import できるようスタブに差し替える（トレーニングでは未使用）。
vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

import {
  useRegisterAdvance,
  useTrainingMode,
} from "../_hooks/use-training-mode";
import { createTrainingView } from "./create-challenge-views";

/**
 * 「わからない」は「盤面が登録した次問題への操作」をシェルのフッターから
 * 開示 → proceed の2段で呼ぶ配線なので、盤面の中身（牌画像・出題生成）ではなく
 * ファクトリと盤面の受け渡しだけを検証する。
 */
function renderTrainingView(advance: (() => void) | undefined) {
  function Board({ showFeedback }: { readonly showFeedback: boolean }) {
    useRegisterAdvance(advance);
    const { isRevealed } = useTrainingMode();
    return (
      <div>
        board feedback:{String(showFeedback)} revealed:{String(isRevealed)}
      </div>
    );
  }

  const TrainingView = createTrainingView({
    slug: "han-count",
    renderBoard: ({ showFeedback }) => <Board showFeedback={showFeedback} />,
  });

  return render(<TrainingView />);
}

describe("createTrainingView わからない（正解開示）", () => {
  it("押すと開示状態になり（盤面は showFeedback 表示）、「次の問題へ」で登録された操作を呼ぶ", () => {
    const advance = vi.fn();
    renderTrainingView(advance);

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    // 開示しただけでは進まない。盤面は回答時と同じ正解表示になる
    expect(advance).not.toHaveBeenCalled();
    expect(screen.getByText(/board feedback:true revealed:true/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(advance).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/board feedback:false revealed:false/),
    ).toBeTruthy();
  });

  it("盤面が操作を登録しない間（出題の生成待ち等）は無効化する", () => {
    renderTrainingView(undefined);

    const reveal = screen.getByRole("button", { name: "revealButton" });
    expect((reveal as HTMLButtonElement).disabled).toBe(true);
  });
});

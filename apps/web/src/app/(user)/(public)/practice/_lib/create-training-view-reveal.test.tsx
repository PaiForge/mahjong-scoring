import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// チャレンジ側のファクトリが Server Action を参照するため、
// クライアントから import できるようスタブに差し替える（トレーニングでは未使用）。
vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

import type { TrainingBoardArgs } from "./create-challenge-views";
import { createTrainingView } from "./create-challenge-views";

/**
 * 「わからない」は「盤面が持つ次問題への操作」をシェルのフッターから
 * 開示→proceed の2段で呼ぶ配線なので、盤面の中身（牌画像・出題生成）ではなく
 * ファクトリの受け渡しだけを検証する。
 */
function renderTrainingView(state: {
  readonly advance?: () => void;
}): ReturnType<typeof render> {
  const TrainingView = createTrainingView<
    Record<string, never>,
    { readonly advance?: () => void }
  >({
    slug: "han-count",
    useBoardState: () => state,
    advanceOf: ({ advance }) => advance,
    renderBoard: (args: TrainingBoardArgs) => (
      <div>board feedback:{String(args.showFeedback)}</div>
    ),
  });

  return render(<TrainingView />);
}

describe("createTrainingView わからない（正解開示）", () => {
  it("押すと開示状態になり（盤面は showFeedback 表示・集計は不変）、「次の問題へ」で操作を呼ぶ", () => {
    const advance = vi.fn();
    renderTrainingView({ advance });

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    // 開示しただけでは進まない。盤面は回答時と同じ正解表示になる
    expect(advance).not.toHaveBeenCalled();
    expect(screen.getByText("board feedback:true")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(advance).toHaveBeenCalledTimes(1);
    expect(screen.getByText("board feedback:false")).toBeTruthy();
  });

  it("advanceOf が undefined を返す間（出題の生成待ち等）は無効化する", () => {
    renderTrainingView({ advance: undefined });

    const reveal = screen.getByRole("button", { name: "revealButton" });
    expect((reveal as HTMLButtonElement).disabled).toBe(true);
  });

  it("advanceOf 未指定の練習には「わからない」リンクを出さない", () => {
    const TrainingView = createTrainingView({
      slug: "han-count",
      renderBoard: () => <div>board</div>,
    });
    render(<TrainingView />);

    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// チャレンジ側のファクトリが Server Action を参照するため、
// クライアントから import できるようスタブに差し替える（トレーニングでは未使用）。
vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

import { createTrainingView } from "./create-challenge-views";

/**
 * スキップは「盤面が持つ次問題への操作」をシェルのフッターから呼ぶ配線なので、
 * 盤面の中身（牌画像・出題生成）ではなくファクトリの受け渡しだけを検証する。
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
    skipOf: ({ advance }) => advance,
    renderBoard: () => <div>board</div>,
  });

  return render(<TrainingView />);
}

describe("createTrainingView スキップ", () => {
  it("skipOf が操作を返すとスキップリンクを表示し、押すとその操作を呼ぶ", () => {
    const advance = vi.fn();
    renderTrainingView({ advance });

    fireEvent.click(screen.getByRole("button", { name: "skipButton" }));
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("skipOf が undefined を返す間（出題の生成待ち等）は無効化する", () => {
    renderTrainingView({ advance: undefined });

    const skip = screen.getByRole("button", { name: "skipButton" });
    expect((skip as HTMLButtonElement).disabled).toBe(true);
  });

  it("skipOf 未指定の練習にはスキップリンクを出さない", () => {
    const TrainingView = createTrainingView({
      slug: "han-count",
      renderBoard: () => <div>board</div>,
    });
    render(<TrainingView />);

    expect(screen.queryByRole("button", { name: "skipButton" })).toBeNull();
  });
});

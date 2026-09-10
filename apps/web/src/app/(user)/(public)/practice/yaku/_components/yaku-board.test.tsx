import { render, screen, cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { YakuBoard } = await import("./yaku-board");
const { YAKU_LIST_HEIGHT_CLASSES } = await import("./yaku-select-list");
const { TrainingModeProvider } = await import("../../_hooks/use-training-mode");

/** トレーニングの回答後の停止中として盤面を描く */
function renderHolding() {
  return render(
    <TrainingModeProvider
      value={{
        isRevealed: false,
        isHolding: true,
        registerAdvance: () => {},
      }}
    >
      <YakuBoard
        showFeedback
        isTraining
        lastAnswerCorrect={false}
        onAnswer={() => {}}
      />
    </TrainingModeProvider>,
  );
}

describe("YakuBoard 回答後の停止", () => {
  beforeEach(() => {
    cleanup();
  });

  it("一覧を答え合わせに入れ替えるが、枠の高さは一覧と同じにする", async () => {
    // 入れ替えで盤面の丈が変わると、押したばかりのボタンとその下が動くため
    renderHolding();

    const title = await screen.findByText("answerCheck");
    const frame = title.closest(
      `.${CSS.escape(YAKU_LIST_HEIGHT_CLASSES.split(" ")[0])}`,
    );
    expect(frame).not.toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("選択中の役の行は停止中も残す（消すと盤面の丈がその分縮む）", async () => {
    renderHolding();

    await screen.findByText("answerCheck");
    expect(screen.getByText("emptySelection")).toBeTruthy();
  });
});

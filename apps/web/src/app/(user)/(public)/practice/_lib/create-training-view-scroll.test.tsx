import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
// チャレンジ側のファクトリが Server Action を参照するため、
// クライアントから import できるようスタブに差し替える（トレーニングでは未使用）。
vi.mock("../_actions/save-practice-result", () => ({
  savePracticeResult: vi.fn(),
}));

import { useRegisterAdvance } from "../_hooks/use-training-mode";
import { createTrainingView } from "./create-challenge-views";
import { PRACTICE_SCROLL_ANCHOR_ID } from "./scroll-anchor";

/**
 * 縦に長い盤面（手牌符など）では回答・開示のボタンが画面下端にあるため、
 * 押した位置のままだと正誤表示も次の問題も画面外に残る。
 * jsdom はレイアウトを持たないので、スクロール先が練習セッションの先頭
 * （ContentContainer のアンカー）であることだけを検証する。
 *
 * スクロールは React のコミット（フォーカス復元）より後に始めるため次フレームまで
 * 遅らせている。クリック後にフレームを進めてから検証すること。
 */
function renderTrainingView() {
  const advance = vi.fn();

  function Board({
    onAnswer,
  }: {
    readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  }) {
    useRegisterAdvance(advance);
    return (
      <button type="button" onClick={() => onAnswer(true, advance)}>
        submit
      </button>
    );
  }

  const TrainingView = createTrainingView({
    slug: "han-count",
    renderBoard: ({ onAnswer }) => <Board onAnswer={onAnswer} />,
  });

  render(<TrainingView />);
}

describe("createTrainingView 出題の先頭へのスクロール", () => {
  let scrollIntoView: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
    vi.useRealTimers();
  });

  /** 遅延させたスクロールを実行させる */
  function flushFrame() {
    act(() => {
      vi.advanceTimersToNextFrame();
    });
  }

  function scrolledAnchorIds() {
    const targets = scrollIntoView.mock.instances as unknown as Element[];
    return targets.map((element) => element.id);
  }

  it("回答すると練習セッションの先頭へ戻す", () => {
    renderTrainingView();

    fireEvent.click(screen.getByRole("button", { name: "submit" }));
    flushFrame();

    expect(scrolledAnchorIds()).toContain(PRACTICE_SCROLL_ANCHOR_ID);
  });

  it("「わからない」でも練習セッションの先頭へ戻す", () => {
    renderTrainingView();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));
    flushFrame();

    expect(scrolledAnchorIds()).toContain(PRACTICE_SCROLL_ANCHOR_ID);
  });

  // 開示中は解説を読むために下へ戻っているため、開示時に一度戻しただけでは足りない
  it("開示後の「次の問題へ」でも練習セッションの先頭へ戻す", () => {
    renderTrainingView();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));
    flushFrame();
    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    flushFrame();

    expect(scrolledAnchorIds()).toContain(PRACTICE_SCROLL_ANCHOR_ID);
  });
});

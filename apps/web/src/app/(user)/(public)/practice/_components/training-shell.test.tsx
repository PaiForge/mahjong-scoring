import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const toastSpy = vi.fn();
vi.mock("react-hot-toast", () => ({
  toast: (message: string) => toastSpy(message),
}));

import { TrainingShell } from "./training-shell";

function renderShell(props: Partial<Parameters<typeof TrainingShell>[0]> = {}) {
  return render(
    <TrainingShell
      title="t"
      correctCount={0}
      totalCount={0}
      exitHref="/practice/score-table"
      {...props}
    >
      <div>body</div>
    </TrainingShell>,
  );
}

describe("TrainingShell わからない（正解開示）", () => {
  it("onReveal 指定時は「わからない」リンクを表示し、クリックで呼ぶ", () => {
    const onReveal = vi.fn();
    renderShell({ onReveal });
    const reveal = screen.getByRole("button", { name: "revealButton" });
    fireEvent.click(reveal);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("onReveal 未指定時は「わからない」を表示しない", () => {
    renderShell();
    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
  });

  it("revealDisabled 時は「わからない」を無効化する", () => {
    const onReveal = vi.fn();
    renderShell({ onReveal, revealDisabled: true });
    const reveal = screen.getByRole("button", { name: "revealButton" });
    expect((reveal as HTMLButtonElement).disabled).toBe(true);
  });

  it("開示中は同じ位置に「次の問題へ」を出し、クリックで onProceed を呼ぶ", () => {
    const onReveal = vi.fn();
    const onProceed = vi.fn();
    renderShell({ onReveal, isRevealed: true, onProceed });

    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(onReveal).not.toHaveBeenCalled();
  });
});

describe("TrainingShell 終了", () => {
  it("終了リンクを押すとチャレンジと同じく終了トーストを出す", () => {
    toastSpy.mockClear();
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "exitButton" }));
    expect(toastSpy).toHaveBeenCalledWith("exitToast");
  });
});

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

describe("TrainingShell スキップ", () => {
  it("onSkip 指定時はスキップリンクを表示し、クリックで呼ぶ", () => {
    const onSkip = vi.fn();
    renderShell({ onSkip });
    const skip = screen.getByRole("button", { name: "skipButton" });
    fireEvent.click(skip);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("onSkip 未指定時はスキップを表示しない", () => {
    renderShell();
    expect(screen.queryByRole("button", { name: "skipButton" })).toBeNull();
  });

  it("skipDisabled 時はスキップを無効化する", () => {
    const onSkip = vi.fn();
    renderShell({ onSkip, skipDisabled: true });
    const skip = screen.getByRole("button", { name: "skipButton" });
    expect((skip as HTMLButtonElement).disabled).toBe(true);
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

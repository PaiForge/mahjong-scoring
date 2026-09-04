import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { takeToastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
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

describe("TrainingShell 回答後の停止", () => {
  it("停止中は盤面の直下に「次の問題へ」を出し、クリックで onProceed を呼ぶ", () => {
    const onProceed = vi.fn();
    renderShell({ isHolding: true, onProceed });

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("停止していないときは「次の問題へ」を出さない", () => {
    renderShell({ onProceed: vi.fn() });

    expect(screen.queryByRole("button", { name: "nextButton" })).toBeNull();
  });
});

describe("TrainingShell 終了", () => {
  it("終了リンクを押すとチャレンジと同じく終了トーストを預ける", () => {
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "exitButton" }));
    // その場では出さず、遷移先の説明ページに着いてから出す
    expect(takeToastOnArrival("/practice/score-table")?.message).toBe(
      "exitToast",
    );
  });
});

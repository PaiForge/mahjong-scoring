import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "./practice-footer-actions";

describe("PracticeFooterAction", () => {
  it("href 指定時はリンクを描画する", () => {
    render(
      <PracticeFooterAction href="/practice">終了する</PracticeFooterAction>,
    );
    const link = screen.getByRole("link", { name: "終了する" });
    expect(link.getAttribute("href")).toBe("/practice");
  });

  it("onClick 指定時はボタンを描画し、クリックで呼ぶ", () => {
    const onClick = vi.fn();
    render(
      <PracticeFooterAction onClick={onClick}>スキップ</PracticeFooterAction>,
    );
    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled 指定時はボタンを無効化する", () => {
    const onClick = vi.fn();
    render(
      <PracticeFooterAction onClick={onClick} disabled>
        スキップ
      </PracticeFooterAction>,
    );
    const button = screen.getByRole("button", { name: "スキップ" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("押し間違いを防ぐタップ領域（min-h-11）を確保する", () => {
    render(
      <PracticeFooterAction href="/practice">終了する</PracticeFooterAction>,
    );
    expect(screen.getByRole("link").className).toContain("min-h-11");
  });
});

describe("PracticeFooterActions", () => {
  it("操作どうしの間に押し間違い防止の余白を置く", () => {
    const { container } = render(
      <PracticeFooterActions>
        <PracticeFooterAction onClick={() => {}}>スキップ</PracticeFooterAction>
        <PracticeFooterAction href="/practice">終了する</PracticeFooterAction>
      </PracticeFooterActions>,
    );
    expect(container.firstElementChild?.className).toContain("gap-3");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { YakuAnswerComparison } from "./yaku-answer-comparison";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

describe("YakuAnswerComparison", () => {
  beforeEach(() => {
    cleanup();
  });

  it("早見表に載る役のチップを押すと役一覧モーダルが開く", () => {
    render(
      <YakuAnswerComparison
        correctYakuNames={["混一色", "立直"]}
        selectedYakuNames={["混一色"]}
        isCorrect={false}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    // 表示名は辞書キー（intl-mock はキーをそのまま返す）
    fireEvent.click(screen.getAllByRole("button", { name: "honitsu" })[0]!);

    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("状況役のチップは押せない", () => {
    render(
      <YakuAnswerComparison
        correctYakuNames={["立直"]}
        selectedYakuNames={[]}
        isCorrect={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "riichi" })).toBeNull();
    expect(screen.getAllByText("riichi").length).toBeGreaterThan(0);
  });
});

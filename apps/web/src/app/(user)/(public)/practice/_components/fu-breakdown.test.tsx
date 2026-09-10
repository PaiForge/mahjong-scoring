import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FuBreakdown } from "./fu-breakdown";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const DETAILS = [
  { reason: "副底", fu: 20 },
  { reason: "中張牌の暗刻", fu: 4 },
  { reason: "嵌張待ち", fu: 2 },
] as const;

describe("FuBreakdown", () => {
  it("翻数の内訳と同じく閉じた状態で始まり、見出しを押すと開く", () => {
    render(
      <FuBreakdown details={DETAILS} answer={30} translationNamespace="x" />,
    );

    const toggle = screen.getByRole("button", { name: "breakdownTitle" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("副底")).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("副底")).toBeTruthy();
    expect(screen.getByText("嵌張待ち")).toBeTruthy();
  });
});

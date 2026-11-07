import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FuBreakdown } from "./fu-breakdown";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("use-intl", async () => await import("@/test/intl-mock"));

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

    const toggle = screen.getByRole("button", { name: "toggle" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("副底")).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("副底")).toBeTruthy();
    expect(screen.getByText("嵌張待ち")).toBeTruthy();
  });

  it("理由は core の日本語ではなく構造（spec）から辞書のキーで引き、spec の無い古い内訳は reason のまま出す", () => {
    render(
      <FuBreakdown
        details={[
          { reason: "副底", fu: 20, spec: { kind: "futei" } },
          { reason: "嵌張待ち", fu: 2 },
        ]}
        answer={30}
        translationNamespace="x"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    // スタブはキーを返すので、辞書を引いた行はキーになる
    expect(screen.getByText("reasons.futei")).toBeTruthy();
    expect(screen.queryByText("副底")).toBeNull();
    expect(screen.getByText("嵌張待ち")).toBeTruthy();
  });

  it("surface を渡すと開いた表の面に反映する（白い面の中では沈めた灰）", () => {
    render(
      <FuBreakdown
        details={DETAILS}
        answer={30}
        translationNamespace="x"
        surface="sunken"
      />,
    );
    const toggle = screen.getByRole("button", { name: "toggle" });
    fireEvent.click(toggle);

    // 開いた中身（aria-controls の先）は内訳が 1 種類なので表の面だけ
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls")!,
    );
    const surface = panel?.firstElementChild;
    expect(surface?.className).toContain("bg-surface-50");
    expect(surface?.className).not.toContain("border");
  });
});

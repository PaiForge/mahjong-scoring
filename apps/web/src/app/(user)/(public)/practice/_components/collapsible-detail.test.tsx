import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleDetail } from "./collapsible-detail";

describe("CollapsibleDetail", () => {
  it("既定は閉じており、見出しを押すと本文が開く", () => {
    render(
      <CollapsibleDetail title="翻数の内訳">
        <p>本文</p>
      </CollapsibleDetail>,
    );
    const toggle = screen.getByRole("button", { name: "翻数の内訳" });

    expect(screen.queryByText("本文")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);

    expect(screen.getByText("本文")).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("直下のボタンへの押し間違いを防ぐタップ領域（min-h-11）を確保する", () => {
    render(
      <CollapsibleDetail title="翻数の内訳">
        <p>本文</p>
      </CollapsibleDetail>,
    );
    expect(
      screen.getByRole("button", { name: "翻数の内訳" }).className,
    ).toContain("min-h-11");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccordionCard } from "./accordion-card";

describe("AccordionCard", () => {
  it("既定では閉じており、本文を描画しない", () => {
    render(
      <AccordionCard title="混一色">
        <p>例示手牌</p>
      </AccordionCard>,
    );

    expect(screen.queryByText("例示手牌")).toBeNull();
  });

  it("ヘッダーを押すと開く", () => {
    render(
      <AccordionCard title="混一色">
        <p>例示手牌</p>
      </AccordionCard>,
    );

    fireEvent.click(screen.getByRole("button", { name: /混一色/ }));
    expect(screen.getByText("例示手牌")).toBeDefined();
  });

  it("autoOpen を渡すと開いた状態で現れ、その位置までスクロールする", () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      render(
        <AccordionCard title="混一色" autoOpen>
          <p>例示手牌</p>
        </AccordionCard>,
      );

      expect(screen.getByText("例示手牌")).toBeDefined();
      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});

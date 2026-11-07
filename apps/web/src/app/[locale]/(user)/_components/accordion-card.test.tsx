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

  it("open を渡すと外の状態で開閉し、押されたら onOpenChange で次の状態を知らせる", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <AccordionCard title="混一色" open={false} onOpenChange={onOpenChange}>
        <p>例示手牌</p>
      </AccordionCard>,
    );

    fireEvent.click(screen.getByRole("button", { name: /混一色/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // 外の状態が変わるまでは閉じたまま
    expect(screen.queryByText("例示手牌")).toBeNull();

    rerender(
      <AccordionCard title="混一色" open onOpenChange={onOpenChange}>
        <p>例示手牌</p>
      </AccordionCard>,
    );
    expect(screen.getByText("例示手牌")).toBeDefined();
  });
});

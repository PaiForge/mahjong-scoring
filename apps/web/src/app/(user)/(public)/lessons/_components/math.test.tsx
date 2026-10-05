import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BlockMath, InlineMath } from "./math";

describe("BlockMath", () => {
  it("renders a KaTeX display-mode equation inside a div", () => {
    const { container } = render(<BlockMath latex="x^2" />);
    const div = container.querySelector("div");
    expect(div).not.toBeNull();
    // KaTeX display mode wraps output in a .katex-display class
    expect(div!.querySelector(".katex-display")).not.toBeNull();
    expect(div!.textContent).toContain("x");
  });

  it("does not throw on invalid LaTeX when throwOnError is false", () => {
    expect(() => render(<BlockMath latex="\\invalid{" />)).not.toThrow();
  });
});

describe("InlineMath", () => {
  it("renders a KaTeX inline equation inside a span", () => {
    const { container } = render(<InlineMath latex="a + b" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    // Inline mode should NOT have .katex-display
    expect(span!.querySelector(".katex-display")).toBeNull();
    // Should have .katex class
    expect(span!.querySelector(".katex")).not.toBeNull();
  });

  it("renders a fraction correctly", () => {
    const { container } = render(<InlineMath latex="\\frac{1}{2}" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span!.querySelector(".katex")).not.toBeNull();
  });
});

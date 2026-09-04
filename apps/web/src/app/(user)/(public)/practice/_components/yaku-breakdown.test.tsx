import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YakuBreakdown } from "./yaku-breakdown";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const YAKU_DETAILS = [
  { name: "立直", han: 1 },
  { name: "混一色", han: 2 },
] as const;

describe("YakuBreakdown", () => {
  it("閉じた状態で始まり、見出しを押すと開く", () => {
    render(<YakuBreakdown yakuDetails={YAKU_DETAILS} />);

    const toggle = screen.getByRole("button");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("立直")).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("立直")).toBeTruthy();
    expect(screen.getByText("混一色")).toBeTruthy();
  });

  it("役が無ければ開閉の見出しごと出さない", () => {
    const { container } = render(<YakuBreakdown yakuDetails={[]} />);

    expect(container.textContent).toBe("");
  });
});

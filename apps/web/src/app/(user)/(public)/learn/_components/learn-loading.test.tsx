import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CURRICULUM } from "../_lib/curriculum";
import { LearnLoading } from "./learn-loading";

const pathname = vi.hoisted(() => ({ value: "/learn" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

function rowCount(container: HTMLElement) {
  return container.querySelectorAll(
    '[data-testid="curriculum-chapter-row-skeleton"]',
  ).length;
}

describe("LearnLoading", () => {
  it("目次（/learn）では目次のスケルトンを出す", () => {
    pathname.value = "/learn";
    const { container } = render(<LearnLoading />);
    expect(rowCount(container)).toBe(CURRICULUM.length);
  });

  it("章ページでは汎用スケルトンを出す", () => {
    pathname.value = "/learn/jantou-fu";
    const { container } = render(<LearnLoading />);
    expect(rowCount(container)).toBe(0);
  });
});

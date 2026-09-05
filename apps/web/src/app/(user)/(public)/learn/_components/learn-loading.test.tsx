import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CURRICULUM } from "../_lib/curriculum";
import { LearnLoading } from "./learn-loading";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

import { setPathname } from "@/test/navigation-mock";

function chapterRowCount(container: HTMLElement) {
  return container.querySelectorAll(
    '[data-testid="curriculum-chapter-row-skeleton"]',
  ).length;
}

function hasChapterSkeleton(container: HTMLElement) {
  return container.querySelector('[data-testid="learn-chapter-skeleton"]');
}

describe("LearnLoading", () => {
  it("目次（/learn）では目次のスケルトンを出す", () => {
    setPathname("/learn");
    const { container } = render(<LearnLoading />);
    expect(chapterRowCount(container)).toBe(CURRICULUM.length);
    expect(hasChapterSkeleton(container)).toBeNull();
  });

  it("章ページでは章ページのスケルトンを出す", () => {
    setPathname("/learn/jantou-fu");
    const { container } = render(<LearnLoading />);
    expect(hasChapterSkeleton(container)).not.toBeNull();
    expect(chapterRowCount(container)).toBe(0);
  });
});

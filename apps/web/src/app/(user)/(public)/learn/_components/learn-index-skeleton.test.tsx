import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CURRICULUM, CURRICULUM_SECTIONS } from "../_lib/curriculum";
import { LearnIndexSkeleton } from "./learn-index-skeleton";

/**
 * スケルトンの行数は `CURRICULUM` から導いている。章を足したのに実物とだけ
 * 行数が変わる、という取り違えが起きないことを押さえる。
 */
describe("LearnIndexSkeleton", () => {
  it("章の数だけ目次行のプレースホルダを描く", () => {
    const { container } = render(<LearnIndexSkeleton />);
    expect(
      container.querySelectorAll(
        '[data-testid="curriculum-chapter-row-skeleton"]',
      ),
    ).toHaveLength(CURRICULUM.length);
  });

  it("章を持つセクションの数だけグループを描く", () => {
    const sectionsWithChapters = CURRICULUM_SECTIONS.filter((section) =>
      CURRICULUM.some((chapter) => chapter.section === section),
    );
    const { container } = render(<LearnIndexSkeleton />);
    expect(
      container.querySelectorAll('[data-testid="curriculum-section-skeleton"]'),
    ).toHaveLength(sectionsWithChapters.length);
  });
});

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CurriculumToc } from "./curriculum-toc";
import type {
  CurriculumChapter,
  CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const chapters: readonly CurriculumChapter[] = [
  {
    slug: "about-this-app",
    section: "introduction",
    order: 10,
    publishedAt: "2026-04-18",
    i18nKey: "learnCurriculum.chapters.aboutThisApp",
  },
  {
    slug: "why-scoring-is-complex",
    section: "introduction",
    order: 20,
    publishedAt: "2026-04-18",
    i18nKey: "learnCurriculum.chapters.whyScoringIsComplex",
  },
];

const section: CurriculumSection = "introduction";

describe("CurriculumToc", () => {
  it("renders a <li> per chapter with a title link to /lessons/<slug>", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(2);
    expect(anchors[0]?.getAttribute("href")).toBe("/lessons/about-this-app");
    expect(anchors[1]?.getAttribute("href")).toBe(
      "/lessons/why-scoring-is-complex",
    );
  });

  it("stretches each title link over its row while keeping the title as the link name", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set(["why-scoring-is-complex"]),
        nextSlug: "about-this-app",
      }),
    );
    for (const row of container.querySelectorAll("li")) {
      // The link's ::after fills the nearest positioned ancestor — the row.
      expect(row.className).toContain("relative");
      expect(row.className).toContain("group");
      const anchor = row.querySelector("a");
      expect(anchor?.className).toContain("after:absolute");
      expect(anchor?.className).toContain("after:inset-0");
      // The description and marks stay outside the link.
      expect(anchor?.textContent).not.toContain("description");
      expect(anchor?.querySelector("[data-testid]")).toBeNull();
    }
  });

  it("renders the dashed guide line", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const line = container.querySelector(
      '[data-testid="curriculum-dashed-line"]',
    );
    expect(line).not.toBeNull();
  });

  it("marks read chapters with an achievement check icon", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set(["about-this-app"]),
        nextSlug: "why-scoring-is-complex",
      }),
    );
    const marks = container.querySelectorAll(
      '[data-testid="curriculum-achieved-mark"]',
    );
    expect(marks).toHaveLength(1);

    const readRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    expect(readRow?.getAttribute("data-done")).toBe("true");

    const unreadRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    expect(unreadRow?.getAttribute("data-done")).toBeNull();
  });

  it("highlights the next chapter with a data-next attribute", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: "about-this-app",
      }),
    );
    const nextRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    expect(nextRow?.getAttribute("data-next")).toBe("true");

    const otherRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    expect(otherRow?.getAttribute("data-next")).toBeNull();
  });

  it("overlays an amber guide line on the next-chapter row aligned with the dashed line", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: "about-this-app",
      }),
    );

    const nextRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    const nextLine = nextRow?.querySelector(
      '[data-testid="curriculum-next-line"]',
    ) as HTMLElement | null;
    expect(nextLine).not.toBeNull();
    // The amber line is absolutely positioned at left=7px so that its 2px width
    // is centered on the dashed guide line's x=8px.
    expect(nextLine?.style.left).toBe("7px");
    expect(nextLine?.className).toContain("absolute");
    expect(nextLine?.className).toContain("bg-amber-500");

    // Non-next rows do not render the amber guide line.
    const otherRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    expect(
      otherRow?.querySelector('[data-testid="curriculum-next-line"]'),
    ).toBeNull();
  });

  it("does not apply a left border on chapter rows (amber line is absolute)", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: "about-this-app",
      }),
    );
    const rows = container.querySelectorAll("li");
    for (const row of rows) {
      expect(row.className).not.toContain("border-l-2");
      expect(row.className).not.toContain("border-l-amber-400");
      expect(row.className).not.toContain("border-l-transparent");
    }
  });

  it('marks the next chapter row with aria-current="step"', async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: "about-this-app",
      }),
    );
    const nextRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    expect(nextRow?.getAttribute("aria-current")).toBe("step");

    const otherRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    expect(otherRow?.getAttribute("aria-current")).toBeNull();
  });

  it("renders the section label as a heading of the given level", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 3,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    // The mocked translator returns the key as-is.
    expect(container.querySelector("h3")?.textContent).toBe(
      "sections.introduction",
    );
    expect(container.querySelector("h2")).toBeNull();
  });

  it("does not label the <section> or <ol> (the heading names the group)", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    expect(container.querySelector("section")?.hasAttribute("aria-label")).toBe(
      false,
    );
    expect(container.querySelector("ol")?.hasAttribute("aria-label")).toBe(
      false,
    );
  });

  it("renders the section label only once alongside the section bullet", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );

    // The section bullet exists exactly once and is paired with the section
    // label in the same row (bullet's parent also contains the label text).
    const bullets = container.querySelectorAll(
      '[data-testid="curriculum-section-bullet"]',
    );
    expect(bullets).toHaveLength(1);
    expect(bullets[0]?.parentElement?.textContent).toContain(
      "sections.introduction",
    );

    // Section label text must not be repeated inside each row.
    const rows = container.querySelectorAll("li");
    for (const row of rows) {
      expect(row.textContent ?? "").not.toContain("sections.introduction");
    }
  });

  it("renders exactly one section bullet regardless of chapter count", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const bullets = container.querySelectorAll(
      '[data-testid="curriculum-section-bullet"]',
    );
    expect(bullets).toHaveLength(1);
  });

  it("does not render a bullet inside individual chapter rows", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const rows = container.querySelectorAll("li");
    for (const row of rows) {
      expect(
        row.querySelector('[data-testid="curriculum-section-bullet"]'),
      ).toBeNull();
    }
  });

  it("places the next-chapter badge at the right end of the row, where the read check sits", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section,
        chapters,
        completedSlugs: new Set(["why-scoring-is-complex"]),
        nextSlug: "about-this-app",
      }),
    );

    const nextRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    const badge = nextRow?.querySelector(
      '[data-testid="curriculum-next-badge"]',
    );
    expect(badge).not.toBeNull();
    // Badge is the row's last child and sits in the right column, apart from
    // the title column.
    expect(badge?.parentElement).toBe(nextRow);
    expect(nextRow?.lastElementChild).toBe(badge);
    expect(badge?.className).toContain("col-start-2");
    expect(nextRow?.querySelector("a")?.className).toContain("col-start-1");

    // Same slot as the read check, so both marks line up in one column.
    const readRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    const mark = readRow?.querySelector(
      '[data-testid="curriculum-achieved-mark"]',
    );
    expect(readRow?.lastElementChild).toBe(mark);
  });

  it("applies the section-specific bullet color class", async () => {
    const { container } = render(
      await CurriculumToc({
        headingLevel: 2,
        section: "fu",
        chapters: [
          {
            slug: "jantou-fu",
            section: "fu",
            order: 30,
            publishedAt: "2026-04-02",
            i18nKey: "learnCurriculum.chapters.jantouFu",
          },
        ],
        completedSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const bullet = container.querySelector(
      '[data-testid="curriculum-section-bullet"]',
    );
    expect(bullet?.className).toContain("bg-primary-500");
    expect(bullet?.getAttribute("data-section")).toBe("fu");
  });

  it("renders nothing when chapters is empty", async () => {
    const result = await CurriculumToc({
      headingLevel: 2,
      section,
      chapters: [],
      completedSlugs: new Set<string>(),
      nextSlug: undefined,
    });
    expect(result).toBeUndefined();
  });
  describe("コラム", () => {
    const column: CurriculumChapter = {
      slug: "why-scoring-is-hard-to-learn",
      section: "introduction",
      order: 15,
      publishedAt: "2026-10-12",
      kind: "column",
      i18nKey: "learnCurriculum.chapters.whyScoringIsHardToLearn",
    };

    it("札とタイトルだけを描き、説明文・完了の印・次の印を持たない", async () => {
      const { container } = render(
        await CurriculumToc({
          headingLevel: 2,
          section,
          chapters: [chapters[0]!, column, chapters[1]!],
          // 完了済み・次として渡されても、コラムの行には印を出さない
          completedSlugs: new Set<string>([column.slug]),
          nextSlug: column.slug,
        }),
      );
      const row = container.querySelector(
        '[data-chapter-slug="why-scoring-is-hard-to-learn"]',
      );
      expect(row?.getAttribute("data-column")).toBe("true");
      expect(row?.querySelector("a")?.getAttribute("href")).toBe(
        "/lessons/why-scoring-is-hard-to-learn",
      );
      expect(row?.textContent).toContain("columnBadge");
      expect(row?.textContent).not.toContain("description");
      expect(
        row?.querySelector('[data-testid="curriculum-achieved-mark"]'),
      ).toBeNull();
      expect(
        row?.querySelector('[data-testid="curriculum-next-badge"]'),
      ).toBeNull();
      expect(row?.getAttribute("aria-current")).toBeNull();
    });
  });
});

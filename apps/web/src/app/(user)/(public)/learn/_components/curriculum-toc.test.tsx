import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CurriculumToc } from "./curriculum-toc";
import type { CurriculumChapter, CurriculumSection } from "../_lib/curriculum";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const chapters: readonly CurriculumChapter[] = [
  {
    slug: "about-this-app",
    section: "foundation",
    order: 10,
    i18nKey: "learnCurriculum.chapters.aboutThisApp",
  },
  {
    slug: "why-scoring-is-complex",
    section: "foundation",
    order: 20,
    i18nKey: "learnCurriculum.chapters.whyScoringIsComplex",
  },
];

const section: CurriculumSection = "foundation";

describe("CurriculumToc", () => {
  it("renders a <li> per chapter with a title link to /learn/<slug>", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(2);
    expect(anchors[0]?.getAttribute("href")).toBe("/learn/about-this-app");
    expect(anchors[1]?.getAttribute("href")).toBe(
      "/learn/why-scoring-is-complex",
    );
  });

  it("renders the dashed guide line", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
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
        section,
        chapters,
        readSlugs: new Set(["about-this-app"]),
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
    expect(readRow?.getAttribute("data-read")).toBe("true");

    const unreadRow = container.querySelector(
      '[data-chapter-slug="why-scoring-is-complex"]',
    );
    expect(unreadRow?.getAttribute("data-read")).toBeNull();
  });

  it("highlights the next chapter with a data-next attribute", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
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
        section,
        chapters,
        readSlugs: new Set<string>(),
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
    expect(nextLine?.className).toContain("bg-amber-400");

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
        section,
        chapters,
        readSlugs: new Set<string>(),
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
        section,
        chapters,
        readSlugs: new Set<string>(),
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

  it("labels the <ol> with the section label for assistive tech", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
        nextSlug: undefined,
      }),
    );
    const ol = container.querySelector("ol");
    // The mocked translator returns the key as-is.
    expect(ol?.getAttribute("aria-label")).toBe("sections.foundation");
  });

  it("renders the section label only once alongside the section bullet", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
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
      "sections.foundation",
    );

    // Section label text must not be repeated inside each row.
    const rows = container.querySelectorAll("li");
    for (const row of rows) {
      expect(row.textContent ?? "").not.toContain("sections.foundation");
    }
  });

  it("renders exactly one section bullet regardless of chapter count", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
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
        section,
        chapters,
        readSlugs: new Set<string>(),
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

  it("places the next-chapter badge next to the chapter title link", async () => {
    const { container } = render(
      await CurriculumToc({
        section,
        chapters,
        readSlugs: new Set<string>(),
        nextSlug: "about-this-app",
      }),
    );

    const nextRow = container.querySelector(
      '[data-chapter-slug="about-this-app"]',
    );
    expect(nextRow).not.toBeNull();

    const link = nextRow?.querySelector("a");
    const badge = nextRow?.querySelector(".bg-amber-100");
    expect(link).not.toBeNull();
    expect(badge).not.toBeNull();
    // Badge must be a sibling of the link (inline with the title), not in a
    // separate upper row.
    expect(badge?.parentElement).toBe(link?.parentElement);
  });

  it("applies the section-specific bullet color class", async () => {
    const { container } = render(
      await CurriculumToc({
        section: "fu",
        chapters: [
          {
            slug: "jantou-fu",
            section: "fu",
            order: 30,
            i18nKey: "learnCurriculum.chapters.jantouFu",
          },
        ],
        readSlugs: new Set<string>(),
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
      section,
      chapters: [],
      readSlugs: new Set<string>(),
      nextSlug: undefined,
    });
    expect(result).toBeUndefined();
  });
});

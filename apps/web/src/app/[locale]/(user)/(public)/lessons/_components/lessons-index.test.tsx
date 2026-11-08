import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";
import { setSearchParams } from "@/test/navigation-mock";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  chaptersBySection,
  isColumnChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";

import type { ChapterRowData } from "./chapter-row";
import {
  LessonsIndex,
  publishedLessonSlugs,
  resolveRankFilter,
} from "./lessons-index";

const { mockGetCompleted } = vi.hoisted(() => ({
  mockGetCompleted: vi.fn<() => Promise<string[]>>(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-completed-lesson-slugs", () => ({
  getCompletedLessonSlugs: mockGetCompleted,
}));

/**
 * ページ（サーバー）が組むのと同じ行。英語は about-this-app だけを未公開
 * （日本語のリンク）にして、許可リストの中身に依らず「英語の次の選び方」を見る
 */
function rowsFor(locale: "ja" | "en"): ChapterRowData[] {
  const grouped = chaptersBySection();
  return CURRICULUM_SECTIONS.flatMap(
    (section) => grouped.get(section) ?? [],
  ).map((chapter) => {
    const path = `/lessons/${chapter.slug}`;
    const crossLocale = locale === "en" && chapter.slug === "about-this-app";
    return {
      slug: chapter.slug,
      kind: isColumnChapter(chapter) ? "column" : "lesson",
      section: chapter.section,
      order: chapter.order,
      navTarget: {
        href: locale === "en" && !crossLocale ? `/en${path}` : path,
        crossLocale,
      },
      title: `title:${chapter.slug}`,
      description: isColumnChapter(chapter) ? undefined : "description",
    };
  });
}

function renderIndex(locale: "ja" | "en" = "ja") {
  return render(
    <LessonsIndex
      rows={rowsFor(locale)}
      adsAfterSection={{
        introduction: <div data-testid="ad-after-introduction" />,
      }}
      allLessonsTarget={{
        href: locale === "en" ? "/en/lessons" : "/lessons",
        crossLocale: false,
      }}
    />,
  );
}

function nextRow(container: HTMLElement) {
  return container.querySelector('[data-next="true"]');
}

function progressValue(container: HTMLElement) {
  return container
    .querySelector('[role="progressbar"]')
    ?.getAttribute("aria-valuenow");
}

beforeEach(() => {
  vi.clearAllMocks();
  setSearchParams("");
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
});

describe("LessonsIndex（全体の目次）", () => {
  it("全章を行にし、アンカーを付け、セクションの切れ目に広告を挟む", () => {
    const { container, getByTestId } = renderIndex();
    expect(container.querySelectorAll("li")).toHaveLength(CURRICULUM.length);
    expect(container.querySelector("#chapter-jantou-fu")).not.toBeNull();
    expect(getByTestId("ad-after-introduction")).toBeDefined();
    expect(container.querySelectorAll("h2").length).toBeGreaterThan(0);
  });

  it("ゲスト（静的 HTML）の次は最初のレッスン、進捗は 0", () => {
    const { container } = renderIndex();
    expect(nextRow(container)?.getAttribute("data-chapter-slug")).toBe(
      "about-this-app",
    );
    expect(progressValue(container)).toBe("0");
    expect(container.textContent).not.toContain("allCompletedMessage");
  });

  it("英語の次と分母は英語で出しているレッスンだけから数える", async () => {
    const { container } = renderIndex("en");
    // about-this-app（日本語のみ）を飛ばし、コラムも飛ばす
    expect(nextRow(container)?.getAttribute("data-chapter-slug")).toBe(
      "why-scoring-is-complex",
    );
    const crossLink = container.querySelector(
      '[data-chapter-slug="about-this-app"] a',
    );
    expect(crossLink?.getAttribute("hrefLang")).toBe("ja");

    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["why-scoring-is-complex"]);
    const signedIn = renderIndex("en");
    const lessons = publishedLessonSlugs(rowsFor("en"));
    expect(lessons).not.toContain("about-this-app");
    await waitFor(() =>
      expect(
        nextRow(signedIn.container)?.getAttribute("data-chapter-slug"),
      ).toBe(lessons[1]),
    );
    expect(progressValue(signedIn.container)).toBe(
      String(Math.round((1 / lessons.length) * 100)),
    );
  });

  it("ログイン後に完了の印と次が付き、全部終えたら完了のメッセージを出す", async () => {
    const allLessons = publishedLessonSlugs(rowsFor("ja"));
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(allLessons);
    const { container } = renderIndex();
    await waitFor(() =>
      expect(container.textContent).toContain("allCompletedMessage"),
    );
    expect(nextRow(container)).toBeNull();
    expect(container.querySelectorAll('[data-done="true"]')).toHaveLength(
      allLessons.length,
    );
    expect(progressValue(container)).toBe("100");
  });
});

describe("LessonsIndex（?rank= で絞った目次）", () => {
  const rank = rankBySlug("kyu-4");

  it("級の前提レッスンだけを並べ、見出しと「すべてのレッスンを見る」を置き、広告は置かない", () => {
    setSearchParams("rank=kyu-4");
    const { container, queryByTestId } = renderIndex();
    const slugs = [...container.querySelectorAll("li")].map((li) =>
      li.getAttribute("data-chapter-slug"),
    );
    expect(slugs).toEqual(rank?.learnChapterSlugs);
    expect(container.textContent).toContain("rankFilterTitle");
    expect(queryByTestId("ad-after-introduction")).toBeNull();
    // 絞った目次は h2（SectionTitle）の下なのでセクション名は h3、アンカーは付けない
    expect(container.querySelector("h3")).not.toBeNull();
    expect(container.querySelector("li[id]")).toBeNull();
    const allLink = [...container.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("allLessonsLink"),
    );
    expect(allLink?.getAttribute("href")).toBe("/lessons");
  });

  it("次と進捗はその級の中で数える", async () => {
    setSearchParams("rank=kyu-4");
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    // 級の外の完了（mangan-ko-ron）は分子に数えない
    mockGetCompleted.mockResolvedValue(["jantou-fu", "mangan-ko-ron"]);
    const { container } = renderIndex();
    expect(nextRow(container)?.getAttribute("data-chapter-slug")).toBe(
      "jantou-fu",
    );
    await waitFor(() =>
      expect(nextRow(container)?.getAttribute("data-chapter-slug")).toBe(
        "mentsu-fu",
      ),
    );
    expect(progressValue(container)).toBe("25");
  });

  it("未知の級・前提レッスンを持たない級は絞らずに全体を出す", () => {
    setSearchParams("rank=no-such-rank");
    const { container } = renderIndex();
    expect(container.querySelectorAll("li")).toHaveLength(CURRICULUM.length);
  });
});

describe("resolveRankFilter", () => {
  it("rank が無ければ絞らない", () => {
    expect(resolveRankFilter(null)).toBeUndefined();
  });

  it("前提レッスンを持つ級だけを返す", () => {
    expect(resolveRankFilter("kyu-4")?.slug).toBe("kyu-4");
    expect(resolveRankFilter("no-such-rank")).toBeUndefined();
  });
});

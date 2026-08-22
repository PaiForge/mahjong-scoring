import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  CURRICULUM_CHAPTER_SLUGS,
  type CurriculumChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const fetchReadChapterSlugs = vi.hoisted(() => vi.fn());
vi.mock("@/app/(user)/(public)/learn/_lib/progress", () => ({
  fetchReadChapterSlugs,
}));

/**
 * 目次・進捗バーは async なサーバーコンポーネントで、入れ子のままでは
 * client render できない。ここでは「どの章を・どの読了数で渡したか」という
 * このコンポーネント自身の責務だけを検証したいので、受け取った props を
 * data 属性に写すスタブに差し替える。描画そのものは各コンポーネントの
 * テスト（curriculum-toc.test.tsx / curriculum-progress-bar.test.tsx）が見る。
 */
vi.mock("@/app/(user)/(public)/learn/_components/curriculum-toc", () => ({
  CurriculumToc: ({
    chapters,
    nextSlug,
  }: {
    chapters: readonly CurriculumChapter[];
    nextSlug: string | undefined;
  }) => (
    <div
      data-testid="toc"
      data-slugs={chapters.map((c) => c.slug).join(",")}
      data-next-slug={nextSlug}
    />
  ),
}));

vi.mock(
  "@/app/(user)/(public)/learn/_components/curriculum-progress-bar",
  () => ({
    CurriculumProgressBar: ({
      readCount,
      totalCount,
      allCompleted,
    }: {
      readCount: number;
      totalCount: number;
      allCompleted: boolean;
    }) => (
      <div
        data-testid="progress"
        data-read={readCount}
        data-total={totalCount}
        data-all-completed={allCompleted ? "true" : "false"}
      />
    ),
  }),
);

const { ContinueLearningSection } = await import("./continue-learning-section");

async function renderSection() {
  return render(await ContinueLearningSection());
}

describe("ContinueLearningSection", () => {
  it("次に読む章を 1 件だけ目次に渡す", async () => {
    fetchReadChapterSlugs.mockResolvedValue(new Set(["about-this-app"]));

    const { getByTestId } = await renderSection();

    const toc = getByTestId("toc");
    expect(toc.getAttribute("data-slugs")).toBe("why-scoring-is-complex");
    expect(toc.getAttribute("data-next-slug")).toBe("why-scoring-is-complex");
  });

  it("読了が 0 件なら最初の章を次の章として渡す", async () => {
    fetchReadChapterSlugs.mockResolvedValue(new Set<string>());

    const { getByTestId } = await renderSection();

    expect(getByTestId("toc").getAttribute("data-slugs")).toBe(
      "about-this-app",
    );
  });

  it("全章読了済みなら目次を出さず完了メッセージを表示する", async () => {
    fetchReadChapterSlugs.mockResolvedValue(new Set(CURRICULUM_CHAPTER_SLUGS));

    const { queryByTestId, getByText, getByTestId } = await renderSection();

    expect(queryByTestId("toc")).toBeNull();
    expect(getByText("allCompletedMessage")).toBeTruthy();
    expect(getByTestId("progress").getAttribute("data-all-completed")).toBe(
      "true",
    );
  });

  it("進捗バーに読了数と総章数を渡す", async () => {
    fetchReadChapterSlugs.mockResolvedValue(
      new Set(["about-this-app", "why-scoring-is-complex"]),
    );

    const { getByTestId } = await renderSection();

    const progress = getByTestId("progress");
    expect(progress.getAttribute("data-read")).toBe("2");
    expect(progress.getAttribute("data-total")).toBe(
      String(CURRICULUM_CHAPTER_SLUGS.length),
    );
    expect(progress.getAttribute("data-all-completed")).toBe("false");
  });

  it("目次ページへのリンクを持つ", async () => {
    fetchReadChapterSlugs.mockResolvedValue(new Set<string>());

    const { container } = await renderSection();

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/learn");
  });
});

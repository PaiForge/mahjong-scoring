import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  CURRICULUM,
  type CurriculumChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

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
    }: {
      readCount: number;
      totalCount: number;
    }) => (
      <div
        data-testid="progress"
        data-read={readCount}
        data-total={totalCount}
      />
    ),
  }),
);

const { ContinueLearningSection } = await import("./continue-learning-section");

const jantouFu = CURRICULUM.find((c) => c.slug === "jantou-fu");
if (jantouFu === undefined) throw new Error("fixture chapter not found");

describe("ContinueLearningSection", () => {
  it("渡された章 1 件だけを目次に流す", async () => {
    const { getByTestId } = render(
      await ContinueLearningSection({
        readSlugs: new Set(["about-this-app"]),
        nextChapter: jantouFu,
      }),
    );

    const toc = getByTestId("toc");
    expect(toc.getAttribute("data-slugs")).toBe("jantou-fu");
    expect(toc.getAttribute("data-next-slug")).toBe("jantou-fu");
  });

  it("進捗バーに読了数と総章数を渡す", async () => {
    const { getByTestId } = render(
      await ContinueLearningSection({
        readSlugs: new Set(["about-this-app", "why-scoring-is-complex"]),
        nextChapter: jantouFu,
      }),
    );

    const progress = getByTestId("progress");
    expect(progress.getAttribute("data-read")).toBe("2");
    expect(progress.getAttribute("data-total")).toBe(String(CURRICULUM.length));
  });

  it("末尾のスロットを目次リンクと並べて描画する", async () => {
    const { getByTestId, container } = render(
      await ContinueLearningSection({
        readSlugs: new Set(),
        nextChapter: jantouFu,
        tailLink: <a data-testid="tail" href="/exam/fu" />,
      }),
    );

    // 目次リンクを押しのけず、同じ行に並ぶ（両方が残っていること）
    expect(getByTestId("tail")).toBeDefined();
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual(expect.arrayContaining(["/exam/fu", "/learn"]));
  });

  it("目次ページへのリンクを持つ", async () => {
    const { container } = render(
      await ContinueLearningSection({
        readSlugs: new Set(),
        nextChapter: jantouFu,
      }),
    );

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/learn");
  });
});

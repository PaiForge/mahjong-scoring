import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  buildJourney,
  type BuildJourneyInput,
  type PracticeAttempt,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { RankJourneyCard } = await import("./rank-journey-card");

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];

function rankJourney(
  slug: string,
  overrides: Partial<BuildJourneyInput> = {},
): RankJourney {
  const journey = buildJourney({
    completedLessonSlugs: NONE,
    attemptedPractices: NO_ATTEMPTS,
    achievedRankSlugs: [],
    ...overrides,
  });
  const found = journey.ranks.find((entry) => entry.rank.slug === slug);
  if (!found) throw new Error(`rank not found: ${slug}`);
  return found;
}

function hrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("a")).map(
    (a) => a.getAttribute("href") ?? "",
  );
}

describe("RankJourneyCard", () => {
  it("開いた級は、レッスン・章から送る練習・試験への導線を並べる", async () => {
    const { container, getAllByRole } = render(
      <ol>
        {await RankJourneyCard({
          journey: rankJourney("kyu-5", {
            completedLessonSlugs: new Set(["mangan-ko-ron"]),
          }),
          expanded: true,
        })}
      </ol>,
    );

    const links = hrefs(container);
    expect(links).toContain("/dojo/ranks/kyu-5");
    for (const chapterSlug of RANK_REGISTRY[0].learnChapterSlugs) {
      expect(links).toContain(`/lessons/${chapterSlug}`);
    }
    expect(links).toContain("/practice/score-table?variant=ko_mangan_plus");
    expect(links).toContain("/practice/mangan-score-calculation");
    expect(links).toContain("/exam/mangan");

    // 終えたレッスンにだけ完了の印が付く
    expect(getAllByRole("img", { name: "lessonDone" })).toHaveLength(1);
    // 各レッスンの行にはレッスンの目次と同じ章の説明を添える
    expect(
      container.textContent?.match(/learnCurriculum\.[\w.]+?\.description/g),
    ).toHaveLength(RANK_REGISTRY[0].learnChapterSlugs.length);
    // 施錠の注記は次の目標の級には出ない
    expect(container.textContent).not.toContain("lockedNote");
    // 進み具合の各段はその段の一覧へ送る（学ぶは目次のその級の最初のレッスン）
    expect(
      Array.from(container.querySelectorAll("[data-stage] a")).map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual([
      "/lessons#chapter-mangan-ko-ron",
      "/practice?rank=kyu-5",
      "/exam/mangan",
    ]);
  });

  it("確認問題を持たないレッスンも同じ行で、同じ章の説明を添える", async () => {
    // 前提章はすべて確認問題を持つので、行程から確認問題を外して作る
    const base = rankJourney("kyu-4", { achievedRankSlugs: ["kyu-5"] });
    const chapters = base.chapters.map((item) => ({
      ...item,
      hasQuiz: false,
      done: item.chapterSlug === "jantou-fu",
    }));
    const { container, getAllByRole } = render(
      <ol>
        {await RankJourneyCard({
          journey: { ...base, chapters },
          expanded: true,
        })}
      </ol>,
    );

    for (const chapterSlug of RANK_REGISTRY[1].learnChapterSlugs) {
      expect(hrefs(container)).toContain(`/lessons/${chapterSlug}`);
    }
    expect(
      container.textContent?.match(/learnCurriculum\.[\w.]+?\.description/g),
    ).toHaveLength(RANK_REGISTRY[1].learnChapterSlugs.length);
    expect(getAllByRole("img", { name: "lessonDone" })).toHaveLength(1);
  });

  it("閉じた上位の級は、級名の詳細リンクと施錠の注記だけで、中身は出さない", async () => {
    const { container, queryByTestId } = render(
      <ol>
        {await RankJourneyCard({
          journey: rankJourney("kyu-4"),
          expanded: false,
        })}
      </ol>,
    );

    expect(hrefs(container)).toEqual(["/dojo/ranks/kyu-4"]);
    expect(queryByTestId("chapters")).toBeNull();
    expect(container.textContent).toContain("lockedNote");
    expect(
      container.querySelector("article")?.getAttribute("data-rank-status"),
    ).toBe("unachieved");
  });

  it("無級なら、次の目標（5級）以外のすべての級に施錠の注記が付く（初段も同じ文言）", async () => {
    const cards = await Promise.all(
      ["kyu-5", "kyu-4", "dan-1"].map((slug) =>
        RankJourneyCard({
          journey: rankJourney(slug),
          expanded: slug === "kyu-5",
        }),
      ),
    );
    const { container } = render(<ol>{cards}</ol>);

    const notes = Array.from(container.querySelectorAll("article")).map(
      (article) => article.textContent?.includes("lockedNote") ?? false,
    );
    expect(notes).toEqual([false, true, true]);
  });

  it("途中の級を持つなら、次の目標より上の級だけに施錠の注記が付く", async () => {
    const achievedRankSlugs = ["kyu-5", "kyu-4"] as const;
    const cards = await Promise.all(
      ["kyu-4", "kyu-3", "kyu-2"].map((slug) =>
        RankJourneyCard({
          journey: rankJourney(slug, {
            achievedRankSlugs: [...achievedRankSlugs],
          }),
          expanded: slug === "kyu-3",
        }),
      ),
    );
    const { container } = render(<ol>{cards}</ol>);

    const notes = Array.from(container.querySelectorAll("article")).map(
      (article) => article.textContent?.includes("lockedNote") ?? false,
    );
    expect(notes).toEqual([false, false, true]);
  });

  it("飛び番で級を持つなら、取得済みの級には出さず、挟まった未取得の級にも上の級にも同じ注記が付く", async () => {
    const achievedRankSlugs = ["kyu-5", "kyu-2"] as const;
    const cards = await Promise.all(
      ["kyu-4", "kyu-3", "kyu-2", "kyu-1"].map((slug) =>
        RankJourneyCard({
          journey: rankJourney(slug, {
            achievedRankSlugs: [...achievedRankSlugs],
          }),
          expanded: slug === "kyu-4",
        }),
      ),
    );
    const { container } = render(<ol>{cards}</ol>);

    const articles = Array.from(container.querySelectorAll("article"));
    expect(
      articles.map((article) => article.getAttribute("data-rank-status")),
    ).toEqual(["next", "unachieved", "achieved", "unachieved"]);
    expect(
      articles.map(
        (article) => article.textContent?.includes("lockedNote") ?? false,
      ),
    ).toEqual([false, true, false, true]);
  });
});

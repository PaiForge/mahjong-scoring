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

/**
 * 前提章の目次は async なサーバーコンポーネントの入れ子で、client render
 * できない。ここでは「どの章を・どれを学んだとして渡したか」だけ見たいので、
 * 受け取った props を data 属性に写すスタブに差し替える。
 */
vi.mock("@/app/(user)/(public)/learn/_components/chapter-toc-list", () => ({
  ChapterTocList: ({
    slugs,
    readSlugs,
  }: {
    slugs: readonly string[];
    readSlugs: ReadonlySet<string>;
  }) => (
    <div
      data-testid="chapters"
      data-slugs={slugs.join(",")}
      data-learned={[...readSlugs].join(",")}
    />
  ),
}));

/** 取得状態の pill も async なサーバーコンポーネント。状態の文字列だけ写す */
vi.mock("../ranks/_components/rank-status-badge", () => ({
  RankStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status">{status}</span>
  ),
}));

const { RankJourneyCard } = await import("./rank-journey-card");

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];

function rankJourney(
  slug: string,
  overrides: Partial<BuildJourneyInput> = {},
): RankJourney {
  const journey = buildJourney({
    readSlugs: NONE,
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
  it("開いた級は、レッスン・前提章・章から送る練習・試験への導線を並べる", async () => {
    const { container, getByTestId } = render(
      <ol>
        {await RankJourneyCard({
          journey: rankJourney("kyu-5", {
            completedLessonSlugs: new Set(["mangan-ko-ron"]),
          }),
          expanded: true,
          requiredRankSlug: "kyu-5",
        })}
      </ol>,
    );

    const links = hrefs(container);
    expect(links).toContain("/dojo/ranks/kyu-5");
    expect(links).toContain("/lessons/mangan-ko-ron");
    expect(links).toContain("/practice/score-table?variant=ko_mangan_plus");
    expect(links).toContain("/practice/mangan-score-calculation");
    expect(links).toContain("/exam/mangan");

    // レッスンを終えた章は「学んだ」として目次に渡る
    const chapters = getByTestId("chapters");
    expect(chapters.getAttribute("data-slugs")).toBe(
      RANK_REGISTRY[0].learnChapterSlugs.join(","),
    );
    expect(chapters.getAttribute("data-learned")).toBe("mangan-ko-ron");
    // 施錠の注記は次の目標の級には出ない
    expect(container.textContent).not.toContain("lockedNote");
  });

  it("閉じた上位の級は、級名の詳細リンクと施錠の注記だけで、中身は出さない", async () => {
    const { container, queryByTestId } = render(
      <ol>
        {await RankJourneyCard({
          journey: rankJourney("kyu-4"),
          expanded: false,
          requiredRankSlug: "kyu-5",
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

  it("取得済みの級には施錠の注記を出さない", async () => {
    const { container } = render(
      <ol>
        {await RankJourneyCard({
          journey: rankJourney("kyu-5", { achievedRankSlugs: ["kyu-5"] }),
          expanded: false,
          requiredRankSlug: "kyu-4",
        })}
      </ol>,
    );

    expect(container.textContent).not.toContain("lockedNote");
    expect(
      container.querySelector("article")?.getAttribute("data-rank-status"),
    ).toBe("achieved");
  });
});

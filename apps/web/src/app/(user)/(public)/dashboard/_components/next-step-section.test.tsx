import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  buildJourney,
  type BuildJourneyInput,
  type PracticeAttempt,
} from "@mahjong-scoring/features/journey/journey";
import { DEFAULT_VARIANT } from "@mahjong-scoring/features/practice-menu-types";
import {
  RANK_REGISTRY,
  RANK_SLUGS,
} from "@mahjong-scoring/features/ranks/registry";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
// 帯色のボタン（LinkButton）が遷移待ちの表示でクライアント側の辞書を引く
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { NextStepSection } = await import("./next-step-section");

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];

function journeyOf(overrides: Partial<BuildJourneyInput> = {}) {
  return buildJourney({
    readSlugs: NONE,
    completedLessonSlugs: NONE,
    attemptedPractices: NO_ATTEMPTS,
    achievedRankSlugs: [],
    ...overrides,
  });
}

/** 帯色のボタン（CTA）の href */
function ctaHref(container: HTMLElement): string | null {
  return (
    container.querySelector("a[class*='press-']")?.getAttribute("href") ?? null
  );
}

describe("NextStepSection", () => {
  it("何も始めていなければ最初のレッスンへ送り、練習一覧へのリンクを添える", async () => {
    const { container, getByText, getByRole } = render(
      await NextStepSection({ journey: journeyOf() }),
    );

    expect(getByText("title")).toBeTruthy();
    expect(
      container.querySelector("section")?.getAttribute("data-next-step"),
    ).toBe("lesson");
    expect(ctaHref(container)).toBe("/lessons/mangan-ko-ron");
    expect(
      getByRole("link", { name: "choosePractice" }).getAttribute("href"),
    ).toBe("/practice");
    // 次の目標は 5級の帯色
    expect(
      container
        .querySelector("[data-belt-slug]")
        ?.getAttribute("data-belt-slug"),
    ).toBe("kyu-5");
    // 進み具合はいま取り組んでいる段（学ぶ）を示す
    expect(
      container
        .querySelector("[aria-current='step']")
        ?.getAttribute("data-stage"),
    ).toBe("learn");
  });

  it("レッスンを終えたら次の章のレッスンへ送り、道場へのリンクを添える", async () => {
    const { container, getByText, getByRole } = render(
      await NextStepSection({
        journey: journeyOf({
          completedLessonSlugs: new Set(["mangan-ko-ron"]),
        }),
      }),
    );

    expect(getByText("title")).toBeTruthy();
    expect(ctaHref(container)).toBe("/lessons/mangan-ko-tsumo");
    expect(
      getByRole("link", { name: "viewJourney" }).getAttribute("href"),
    ).toBe("/dojo");
  });

  it("子のロン・ツモを学び終えたら、章から送っている練習へバリアント付きで送る", async () => {
    const { container } = render(
      await NextStepSection({
        journey: journeyOf({
          completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
        }),
      }),
    );

    expect(ctaHref(container)).toBe(
      "/practice/score-table?variant=ko_mangan_plus",
    );
  });

  it("学ぶ・練習するが済んだら昇級試験の説明ページへ送る", async () => {
    const { container } = render(
      await NextStepSection({
        journey: journeyOf({
          // 5級の章はレッスン（スラッグは章と同じ）で学ぶ
          completedLessonSlugs: new Set(RANK_REGISTRY[0].learnChapterSlugs),
          attemptedPractices: [
            { slug: "score-table", variant: "ko_mangan_plus" },
            { slug: "score-table", variant: "oya_mangan_plus" },
            { slug: "mangan-score-calculation", variant: DEFAULT_VARIANT },
            { slug: "yaku-han", variant: "no_kuisagari" },
            { slug: "yaku", variant: DEFAULT_VARIANT },
            { slug: "han-count", variant: DEFAULT_VARIANT },
          ],
        }),
      }),
    );

    expect(
      container.querySelector("section")?.getAttribute("data-next-step"),
    ).toBe("exam");
    expect(ctaHref(container)).toBe("/exam/mangan");
    expect(
      container
        .querySelector("[aria-current='step']")
        ?.getAttribute("data-stage"),
    ).toBe("exam");
  });

  it("レッスンの無い章は、教本の章を読む一歩として送る", async () => {
    // 前提章のレッスンに頼らないよう、章を読む一歩は行程に直接置く
    const { container } = render(
      await NextStepSection({
        journey: {
          ...journeyOf({ achievedRankSlugs: ["kyu-5"] }),
          nextStep: { kind: "read", chapterSlug: "jantou-fu" },
        },
      }),
    );

    expect(
      container.querySelector("section")?.getAttribute("data-next-step"),
    ).toBe("read");
    expect(ctaHref(container)).toBe("/learn/jantou-fu");
  });

  it("全級取得済みなら何も描画しない", async () => {
    const { container } = render(
      await NextStepSection({
        journey: journeyOf({ achievedRankSlugs: RANK_SLUGS }),
      }),
    );

    expect(container.innerHTML).toBe("");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  buildJourney,
  type BuildJourneyInput,
} from "@mahjong-scoring/features/journey/journey";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  RANK_REGISTRY,
  RANK_SLUGS,
} from "@mahjong-scoring/features/ranks/registry";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
// 帯色のボタン（LinkButton）が遷移待ちの表示でクライアント側の辞書を引く
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { NextStepSection } = await import("./next-step-section");

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: ReadonlySet<PracticeMenuSlug> = new Set();

function journeyOf(overrides: Partial<BuildJourneyInput> = {}) {
  return buildJourney({
    readSlugs: NONE,
    completedLessonSlugs: NONE,
    attemptedSlugs: NO_ATTEMPTS,
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
  it("何も始めていなければ「黒帯への第一歩」としてレッスンへ送り、練習一覧へのリンクを添える", async () => {
    const { container, getByText, getByRole } = render(
      await NextStepSection({ journey: journeyOf() }),
    );

    expect(getByText("firstStepTitle")).toBeTruthy();
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
  });

  it("レッスンを終えたら「次の一歩」として次の章へ送り、道場へのリンクを添える", async () => {
    const { container, getByText, getByRole } = render(
      await NextStepSection({
        journey: journeyOf({
          completedLessonSlugs: new Set(["mangan-ko-ron"]),
        }),
      }),
    );

    expect(getByText("title")).toBeTruthy();
    expect(ctaHref(container)).toBe("/learn/mangan-ko-tsumo");
    expect(
      getByRole("link", { name: "viewJourney" }).getAttribute("href"),
    ).toBe("/dojo");
  });

  it("前提章を学び終えたら、章から送っている練習へバリアント付きで送る", async () => {
    const { container } = render(
      await NextStepSection({
        journey: journeyOf({
          readSlugs: new Set(RANK_REGISTRY[0].learnChapterSlugs),
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
          readSlugs: new Set(RANK_REGISTRY[0].learnChapterSlugs),
          attemptedSlugs: new Set([
            "score-table",
            "mangan-score-calculation",
            "yaku-han",
            "yaku",
            "han-count",
          ]),
        }),
      }),
    );

    expect(
      container.querySelector("section")?.getAttribute("data-next-step"),
    ).toBe("exam");
    expect(ctaHref(container)).toBe("/exam/mangan");
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

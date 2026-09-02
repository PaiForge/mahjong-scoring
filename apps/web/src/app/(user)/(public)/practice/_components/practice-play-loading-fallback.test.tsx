import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { PracticePlayLoadingFallback } from "./practice-play-loading-fallback";

/** 残機のプレースホルダは丸い矩形。状態バーの右端にその数だけ並ぶ */
function lifeSlotCount(container: HTMLElement): number {
  return container.querySelectorAll(".animate-pulse.rounded-full.size-5")
    .length;
}

describe("PracticePlayLoadingFallback の残機", () => {
  it("渡されたミス上限の数だけ残機を描く", () => {
    const { container } = render(
      <PracticePlayLoadingFallback practiceTitle="x" mistakeLimit={3} />,
    );

    expect(lifeSlotCount(container)).toBe(3);
  });

  it("昇級試験（ミス1回で終了）では残機を1つだけ描く", () => {
    // 固定値で描くと、試験のスケルトンが実物より 2 個多い残機を見せてしまう
    const { container } = render(
      <PracticePlayLoadingFallback
        practiceTitle="x"
        mistakeLimit={practiceMenuBySlug("mangan-exam").mistakeLimit}
      />,
    );

    expect(lifeSlotCount(container)).toBe(1);
  });
});

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

import { practiceMenuBySlug } from "@mahjong-scoring/features/practice-menu-types";
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

describe("PracticePlayLoadingFallback の列幅", () => {
  it("既定は loading.tsx 向けの max-w-lg", () => {
    const { container } = render(
      <PracticePlayLoadingFallback practiceTitle="x" mistakeLimit={3} />,
    );
    expect(container.querySelector(".mx-auto.max-w-lg")).not.toBeNull();
  });

  it("play 画面の中の待ちは本体と同じ幅で描く", () => {
    const { container } = render(
      <PracticePlayLoadingFallback
        practiceTitle="x"
        mistakeLimit={3}
        maxWidth="max-w-2xl"
      />,
    );
    expect(container.querySelector(".mx-auto.max-w-2xl")).not.toBeNull();
    expect(container.querySelector(".mx-auto.max-w-lg")).toBeNull();
  });
});

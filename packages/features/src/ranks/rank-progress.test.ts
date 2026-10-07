import { describe, expect, it } from "vitest";

import { buildRankProgress } from "./rank-progress";
import { RANK_REGISTRY } from "./registry";

describe("buildRankProgress", () => {
  it("無級なら最初の級だけが次で、残りは先の級", () => {
    const progress = buildRankProgress(undefined);
    expect(progress.achievedCount).toBe(0);
    expect(progress.totalCount).toBe(RANK_REGISTRY.length);
    expect(progress.segments.map((s) => s.state)).toEqual([
      "next",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(progress.segments.some((s) => s.isCurrent)).toBe(false);
  });

  it("現在の級以下を取得済みとし、その次を次の級にする", () => {
    const progress = buildRankProgress("kyu-4");
    expect(progress.achievedCount).toBe(2);
    expect(progress.segments.map((s) => s.state)).toEqual([
      "achieved",
      "achieved",
      "next",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(progress.segments.filter((s) => s.isCurrent)).toEqual([
      { slug: "kyu-4", state: "achieved", isCurrent: true },
    ]);
  });

  it("最上位の級ならすべて取得済みで次の級は無い", () => {
    const top = RANK_REGISTRY[RANK_REGISTRY.length - 1]!;
    const progress = buildRankProgress(top.slug);
    expect(progress.achievedCount).toBe(RANK_REGISTRY.length);
    expect(progress.segments.every((s) => s.state === "achieved")).toBe(true);
  });
});

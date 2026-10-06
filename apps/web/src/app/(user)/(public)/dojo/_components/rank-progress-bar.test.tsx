import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const { RankProgressBar } = await import("./rank-progress-bar");

function segmentStates(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("li[data-state]")).map(
    (li) => li.getAttribute("data-state") ?? "",
  );
}

describe("RankProgressBar", () => {
  it("級ごとに 1 区切りを並べる", async () => {
    const { container } = render(
      await RankProgressBar({ currentSlug: undefined }),
    );
    expect(container.querySelectorAll("li[data-rank-slug]")).toHaveLength(
      RANK_REGISTRY.length,
    );
  });

  it("無級は何も塗らず、5級を次の目標にする", async () => {
    const { container } = render(
      await RankProgressBar({ currentSlug: undefined }),
    );
    expect(segmentStates(container)).toEqual([
      "next",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute("aria-valuenow")).toBe("0");
    expect(bar?.getAttribute("aria-valuemax")).toBe(
      String(RANK_REGISTRY.length),
    );
  });

  it("現在の級以下を取得済みとして塗り、その 1 つ上を次の目標にする", async () => {
    const { container } = render(
      await RankProgressBar({ currentSlug: "kyu-4" }),
    );
    expect(segmentStates(container)).toEqual([
      "achieved",
      "achieved",
      "next",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(
      container
        .querySelector('[role="progressbar"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("2");
  });

  it("取得済みの区切りはその級の帯色で塗る", async () => {
    const { container } = render(
      await RankProgressBar({ currentSlug: "kyu-4" }),
    );
    const kyu4 = container.querySelector('li[data-rank-slug="kyu-4"] > div');
    expect(kyu4?.className).toContain("bg-blue-500");
  });

  it("初段ではすべてを塗り、次の目標を持たない", async () => {
    const { container } = render(
      await RankProgressBar({ currentSlug: "dan-1" }),
    );
    expect(segmentStates(container).every((s) => s === "achieved")).toBe(true);
  });
});

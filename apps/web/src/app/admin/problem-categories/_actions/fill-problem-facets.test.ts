// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  fill: vi.fn(),
  coverage: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../../_lib/auth", () => ({ requireAdminActor: mocks.actor }));
vi.mock("@/lib/practice-problems/facets", () => ({
  fillMissingProblemFacets: mocks.fill,
  countProblemFacetCoverage: mocks.coverage,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "@/test/log-error-mock";

import { fillProblemFacets } from "./fill-problem-facets";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ actorId: "admin", ipAddress: "127.0.0.1" });
  mocks.fill.mockResolvedValue({
    computed: 3,
    failed: 1,
    skipped: 2,
    errored: 0,
    elapsedMs: 12,
  });
  mocks.coverage.mockResolvedValue([
    { kind: "agari-score", total: 10, ok: 6, failed: 1, missing: 3 },
    { kind: "tenpai-score", total: 5, ok: 1, failed: 0, missing: 4 },
  ]);
});

describe("fillProblemFacets", () => {
  it("管理者でなければ、計算を走らせずに unauthorized を返す", async () => {
    mocks.actor.mockResolvedValue({ error: "unauthorized" });

    expect(await fillProblemFacets()).toEqual({ error: "unauthorized" });
    expect(mocks.actor).toHaveBeenCalledWith("unauthorized");
    expect(mocks.fill).not.toHaveBeenCalled();
  });

  it("不足分の補充を 1 回走らせ、結果と実行後の未計算の数（種別の合計）を返す", async () => {
    expect(await fillProblemFacets()).toEqual({
      success: true,
      summary: { computed: 3, failed: 1, errored: 0, missing: 7 },
    });
    // 上限は cron と同じ既定に任せる
    expect(mocks.fill).toHaveBeenCalledWith();
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/problem-categories");
  });

  it("失敗は failed を返してログに残し、ページを更新しない", async () => {
    mocks.fill.mockRejectedValue(new Error("connection refused"));

    expect(await fillProblemFacets()).toEqual({ error: "failed" });
    expect(logExternalError).toHaveBeenCalledWith(
      "fillProblemFacets",
      expect.any(String),
      expect.any(Error),
    );
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

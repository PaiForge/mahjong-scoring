import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { select: mockSelect } }));
vi.mock("@/lib/db/schema", async () => await import("@/test/schema-mock"));
vi.mock("drizzle-orm", async () => {
  const operators = await import("@/test/drizzle-orm-mock");
  return {
    ...operators,
    notInArray: (...args: unknown[]) => ({ op: "notInArray", args }),
    count: () => "count(*)",
  };
});

import { createQueryChain } from "@/test/drizzle-mock";

import { getChallengeResultsPaginated } from "./queries";

const ROW = {
  id: "r1",
  menuType: "jantou_fu",
  leaderboardKey: "default",
  score: 12,
  incorrectAnswers: 1,
  createdAt: new Date("2026-10-09T15:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getChallengeResultsPaginated", () => {
  it("範囲内のページは件数と行を一度ずつ引く", async () => {
    const rowsChain = createQueryChain([ROW]);
    mockSelect
      .mockReturnValueOnce(createQueryChain([{ count: 21 }]))
      .mockReturnValueOnce(rowsChain);

    const result = await getChallengeResultsPaginated("u1", 2);

    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(rowsChain.limit).toHaveBeenCalledWith(20);
    expect(rowsChain.offset).toHaveBeenCalledWith(20);
    expect(result).toEqual({
      items: [
        {
          id: "r1",
          menuType: "jantou_fu",
          variant: "default",
          score: 12,
          incorrectAnswers: 1,
          createdAt: ROW.createdAt,
        },
      ],
      totalPages: 2,
      currentPage: 2,
    });
  });

  it("件数を超えるページは最後のページに丸め、その行を引き直す（空の OFFSET を返さない）", async () => {
    const outOfRange = createQueryChain([]);
    const lastPage = createQueryChain([ROW]);
    mockSelect
      .mockReturnValueOnce(createQueryChain([{ count: 3 }]))
      .mockReturnValueOnce(outOfRange)
      .mockReturnValueOnce(lastPage);

    const result = await getChallengeResultsPaginated("u1", 9);

    expect(outOfRange.offset).toHaveBeenCalledWith(160);
    expect(lastPage.offset).toHaveBeenCalledWith(0);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it("記録が無ければ 1 ページ目の空の一覧", async () => {
    mockSelect
      .mockReturnValueOnce(createQueryChain([{ count: 0 }]))
      .mockReturnValueOnce(createQueryChain([]))
      .mockReturnValueOnce(createQueryChain([]));

    const result = await getChallengeResultsPaginated("u1", 9);

    expect(result).toEqual({ items: [], totalPages: 1, currentPage: 1 });
  });
});

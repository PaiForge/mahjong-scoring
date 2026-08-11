import { describe, it, expect, vi, beforeEach } from "vitest";

import type { QueryChainMock } from "@/test/drizzle-mock";

vi.mock("server-only", () => ({}));

// vi.mock の factory は巻き上げられるため、チェーンは hoisted な入れ物経由で受け取る
const holder = vi.hoisted(() => ({
  chain: undefined as unknown as QueryChainMock,
}));

vi.mock("./db", async () => {
  const { createQueryChain } = await import("@/test/drizzle-mock");
  holder.chain = createQueryChain();
  return {
    db: { select: vi.fn(() => holder.chain) },
    profiles: { id: "id", bannedAt: "banned_at" },
  };
});

import { isUserBanned } from "./ban";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isUserBanned", () => {
  it("returns false when no profile is found", async () => {
    holder.chain.limit.mockResolvedValue([]);
    expect(await isUserBanned("unknown-user")).toBe(false);
  });

  it("returns false when bannedAt is null", async () => {
    holder.chain.limit.mockResolvedValue([{ bannedAt: undefined }]);
    expect(await isUserBanned("user-1")).toBe(false);
  });

  it("returns true when bannedAt is a date", async () => {
    holder.chain.limit.mockResolvedValue([
      { bannedAt: new Date("2026-01-01") },
    ]);
    expect(await isUserBanned("user-2")).toBe(true);
  });
});

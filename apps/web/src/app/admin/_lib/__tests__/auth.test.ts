import { describe, expect, it, vi, beforeEach } from "vitest";

import type { QueryChainMock } from "@/test/drizzle-mock";

const { mockGetUser, holder, mockNotFound } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  holder: { chain: undefined as unknown as QueryChainMock },
  mockNotFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock next/navigation notFound（呼び出しを検知するため throw する）
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

// Mock the Supabase server client
vi.mock("../../../../lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}));

// Mock the DB module
vi.mock("../../../../lib/db", async () => {
  const { createQueryChain } = await import("@/test/drizzle-mock");
  const { userRoles } = await import("@/test/schema-mock");
  holder.chain = createQueryChain();
  return {
    db: { select: holder.chain.select },
    userRoles,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { requireAdmin, requireAdminPage } from "../auth";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated admin user", () => {
    it("returns userId on success", async () => {
      const userId = "user-123";
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId } },
      });
      holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

      const result = await requireAdmin();

      expect(result).toEqual({ userId });
    });
  });

  describe("unauthenticated user", () => {
    it("returns error when user is not logged in", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });

    it("returns error when user is null", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });
  });

  describe("authenticated but non-admin user", () => {
    it('returns error when user has "user" role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-456" } },
      });
      holder.chain.limit.mockResolvedValue([
        { userId: "user-456", role: "user" },
      ]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });

    it("returns error when user has no role record at all", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-789" } },
      });
      holder.chain.limit.mockResolvedValue([]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: "unauthorized" });
    });
  });

  describe("DB query is called correctly for authenticated users", () => {
    it("queries the userRoles table with the correct userId", async () => {
      const userId = "user-abc";
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId } },
      });
      holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

      await requireAdmin();

      expect(holder.chain.select).toHaveBeenCalledOnce();
      expect(holder.chain.from).toHaveBeenCalledOnce();
      expect(holder.chain.where).toHaveBeenCalledOnce();
      expect(holder.chain.limit).toHaveBeenCalledWith(1);
    });

    it("does not query DB when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      await requireAdmin();

      expect(holder.chain.select).not.toHaveBeenCalled();
    });
  });
});

describe("requireAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the userId without calling notFound for an admin", async () => {
    const userId = "user-123";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
    holder.chain.limit.mockResolvedValue([{ userId, role: "admin" }]);

    const result = await requireAdminPage();

    expect(result).toBe(userId);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound for a non-admin user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } } });
    holder.chain.limit.mockResolvedValue([
      { userId: "user-456", role: "user" },
    ]);

    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("calls notFound for an unauthenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});

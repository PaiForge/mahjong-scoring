/**
 * fetchUserDetail の「無い」と「失敗」の分け方のテスト
 *
 * @description
 * - UUID の形でない ID: 問い合わせずに null（ページは 404）
 * - 認証サーバーが 404: null
 * - それ以外の失敗（届かない・障害）: 投げる（「見つかりません」に見せない）
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/app/admin/_lib/log-query-helpers", () => ({
  buildProfileMap: vi.fn(),
}));

import { fetchUserDetail } from "./queries";

const USER_ID = "00000000-0000-4000-8000-000000000001";

function adminClientReturning(result: unknown) {
  const getUserById = vi.fn().mockResolvedValue(result);
  const client = {
    auth: { admin: { getUserById } },
  } as unknown as SupabaseClient;
  return { client, getUserById };
}

describe("fetchUserDetail", () => {
  it("returns null without asking when the id is not a UUID", async () => {
    const { client, getUserById } = adminClientReturning({
      data: { user: null },
      error: null,
    });

    await expect(fetchUserDetail(client, "not-a-uuid")).resolves.toBeNull();
    expect(getUserById).not.toHaveBeenCalled();
  });

  it("returns null when the auth server says the user does not exist", async () => {
    const { client } = adminClientReturning({
      data: { user: null },
      error: { status: 404, message: "User not found" },
    });

    await expect(fetchUserDetail(client, USER_ID)).resolves.toBeNull();
  });

  it.each([
    ["the auth server is unreachable", 0],
    ["the auth server fails", 500],
  ])("throws when %s", async (_label, status) => {
    const { client } = adminClientReturning({
      data: { user: null },
      error: { status, message: "boom" },
    });

    await expect(fetchUserDetail(client, USER_ID)).rejects.toThrow(
      `Failed to fetch user ${USER_ID}`,
    );
  });
});

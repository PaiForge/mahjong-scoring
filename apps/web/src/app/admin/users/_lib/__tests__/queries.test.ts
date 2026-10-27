import type { SupabaseClient, User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

import { fetchUsersPageData } from "../queries";

vi.mock("@/app/admin/_lib/log-query-helpers", () => ({
  findUserIdsMatching: vi.fn(),
}));
vi.mock("@/lib/supabase/list-all-auth-users", () => ({
  listAllAuthUsers: vi.fn(),
}));

const listUsers = vi.fn();
const adminClient = {
  auth: { admin: { listUsers } },
} as unknown as SupabaseClient;

function fakeUser(id: string): User {
  return { id } as User;
}

describe("fetchUsersPageData（検索なし）", () => {
  beforeEach(() => {
    listUsers.mockReset();
  });

  it("範囲内のページは 1 回の取得で返す", async () => {
    listUsers.mockResolvedValue({
      data: { users: [fakeUser("a")], total: 45 },
      error: undefined,
    });

    const result = await fetchUsersPageData(adminClient, 2, "");

    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ currentPage: 2, totalPages: 3 });
  });

  it("最終ページを超えたら最終ページに丸めて引き直す", async () => {
    listUsers
      .mockResolvedValueOnce({
        data: { users: [], total: 45 },
        error: undefined,
      })
      .mockResolvedValueOnce({
        data: { users: [fakeUser("last")], total: 45 },
        error: undefined,
      });

    const result = await fetchUsersPageData(adminClient, 9, "");

    expect(listUsers).toHaveBeenLastCalledWith({
      page: 3,
      perPage: DEFAULT_PAGE_SIZE,
    });
    expect(result).toEqual({
      users: [fakeUser("last")],
      totalCount: 45,
      currentPage: 3,
      totalPages: 3,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountDeletion } from "../db/schema";

/**
 * 退会の要求の行を 1 つだけ持つ偽の DB
 *
 * 退会の処理は「行を読み、工程を進め、終えた工程を行に書く」を繰り返す。
 * その状態の移り変わりを確かめるため、`account_deletions` の行を 1 つ
 * 持ち、受付の INSERT・貸し出しの UPDATE・工程の記録・状態の SELECT を
 * その行に対して行う。データ削除のトランザクションの中身は数えるだけ。
 */
const state = vi.hoisted(() => ({
  row: undefined as AccountDeletion | undefined,
  calls: [] as string[],
}));

const mocks = vi.hoisted(() => ({
  authDelete: vi.fn(),
  storageList: vi.fn(),
  storageRemove: vi.fn(),
  lockForDeletion: vi.fn(),
  dataDeletes: vi.fn(),
  appleRevoke: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/cache-tags", () => ({ purgeLeaderboardCache: vi.fn() }));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));
vi.mock("@/lib/apple/refresh-tokens", () => ({
  revokeAppleTokensForDeletion: mocks.appleRevoke,
}));
vi.mock("./account-write-lock", () => ({
  lockAccountForDeletion: async () => {
    state.calls.push("lock");
    mocks.lockForDeletion();
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { deleteUser: mocks.authDelete } },
    storage: {
      from: () => ({ list: mocks.storageList, remove: mocks.storageRemove }),
    },
  }),
}));

vi.mock("@/lib/db", async () => {
  const schema = await import("../db/schema");
  const { accountDeletions } = schema;

  /** データ削除のトランザクション（行の削除・匿名化）。呼ばれた表を数えるだけ */
  const dataTx = {
    select: () => ({
      from: () => ({ where: () => ({ for: async () => [] }) }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        if (state.calls.at(-1) !== "data") state.calls.push("data");
        mocks.dataDeletes(table);
      },
    }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  };

  /** 受付のトランザクション（要求の行の INSERT） */
  const requestTx = {
    insert: () => ({
      values: (values: { userId: string }) => ({
        onConflictDoNothing: async () => {
          state.calls.push("insert");
          state.row ??= {
            userId: values.userId,
            requestedAt: new Date(),
            dataDeletedAt: null,
            storageDeletedAt: null,
            authDeletedAt: null,
            appleRevokedAt: null,
            completedAt: null,
            attempts: 0,
            lastAttemptAt: null,
            lastError: null,
          };
        },
      }),
    }),
  };

  const leaseExpiredBefore = () => new Date(Date.now() - 2 * 60 * 1000);

  return {
    ...schema,
    db: {
      // 受付は insert を、データ削除は select / delete / update を使う
      transaction: async (run: (tx: unknown) => Promise<unknown>) =>
        run({ ...dataTx, ...requestTx }),
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () =>
                state.row && !state.row.completedAt
                  ? [{ userId: state.row.userId }]
                  : [],
            }),
            limit: async () =>
              state.row ? [{ completedAt: state.row.completedAt }] : [],
          }),
        }),
      }),
      update: (table: unknown) => ({
        set: (values: Partial<AccountDeletion> & { attempts?: unknown }) => {
          if (table !== accountDeletions) throw new Error("unexpected update");
          const isLease = "attempts" in values;
          return {
            // 工程の記録（markStep）
            where: () => {
              const write = Promise.resolve().then(() => {
                if (isLease || !state.row) return;
                Object.assign(state.row, values);
              });
              return Object.assign(write, {
                // 貸し出し（leaseDeletion）
                returning: async () => {
                  const row = state.row;
                  if (
                    !row ||
                    row.completedAt ||
                    (row.lastAttemptAt &&
                      row.lastAttemptAt >= leaseExpiredBefore())
                  )
                    return [];
                  row.lastAttemptAt = new Date();
                  row.attempts += 1;
                  return [{ ...row }];
                },
              });
            },
          };
        },
      }),
    },
  };
});

import {
  processAccountDeletion,
  processPendingAccountDeletions,
  requestAccountDeletion,
} from "./delete-account";
import { challengeAttempts, notifications, purchases } from "../db/schema";

const USER = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  state.row = undefined;
  state.calls = [];
  mocks.storageList.mockResolvedValue({
    data: [{ name: "avatar.webp" }],
    error: null,
  });
  mocks.storageRemove.mockResolvedValue({ error: null });
  mocks.authDelete.mockResolvedValue({ error: null });
  mocks.appleRevoke.mockResolvedValue(undefined);
});

describe("requestAccountDeletion", () => {
  it("進行中の書き込みを待ってから要求を書き、データ → Storage → Auth の順に終える", async () => {
    const order: string[] = [];
    mocks.storageRemove.mockImplementation(async () => {
      order.push("storage");
      return { error: null };
    });
    mocks.authDelete.mockImplementation(async () => {
      order.push("auth");
      return { error: null };
    });

    expect(await requestAccountDeletion(USER)).toBe("completed");

    expect(state.calls.slice(0, 3)).toEqual(["lock", "insert", "data"]);
    expect(order).toEqual(["storage", "auth"]);
    expect(mocks.authDelete).toHaveBeenCalledWith(USER, true);
    expect(state.row).toMatchObject({
      dataDeletedAt: expect.any(Date),
      storageDeletedAt: expect.any(Date),
      authDeletedAt: expect.any(Date),
      completedAt: expect.any(Date),
      lastError: null,
    });
  });

  it("Apple の連携の取り消しは Auth の無効化の後に行う", async () => {
    const order: string[] = [];
    mocks.authDelete.mockImplementation(async () => {
      order.push("auth");
      return { error: null };
    });
    mocks.appleRevoke.mockImplementation(async () => {
      order.push("apple");
    });

    expect(await requestAccountDeletion(USER)).toBe("completed");
    expect(order).toEqual(["auth", "apple"]);
    expect(mocks.appleRevoke).toHaveBeenCalledWith(USER);
    expect(state.row).toMatchObject({ appleRevokedAt: expect.any(Date) });
  });

  it("途中のチャレンジ・通知・購入も消す（Auth のソフト削除では CASCADE しない）", async () => {
    await requestAccountDeletion(USER);

    for (const table of [challengeAttempts, notifications, purchases])
      expect(mocks.dataDeletes).toHaveBeenCalledWith(table);
  });

  it("受付は冪等: 2 度目は工程をやり直さず、今の状態を返す", async () => {
    await requestAccountDeletion(USER);
    vi.clearAllMocks();

    expect(await requestAccountDeletion(USER)).toBe("completed");
    expect(mocks.dataDeletes).not.toHaveBeenCalled();
    expect(mocks.authDelete).not.toHaveBeenCalled();
  });
});

describe("processAccountDeletion", () => {
  /**
   * Storage の一時障害で止まっても、受付は成立している。終えた工程は
   * やり直さず、止まった工程から再開する。
   */
  it("Storage が失敗したら pending で止まり、次の試行は Storage から再開する", async () => {
    mocks.storageRemove.mockResolvedValueOnce({
      error: { message: "storage down" },
    });

    expect(await requestAccountDeletion(USER)).toBe("pending");
    expect(state.row).toMatchObject({
      dataDeletedAt: expect.any(Date),
      storageDeletedAt: null,
      authDeletedAt: null,
      completedAt: null,
      lastError: "storage remove: storage down",
      // 貸し出しを返し、cron がすぐ拾える
      lastAttemptAt: null,
    });
    expect(mocks.authDelete).not.toHaveBeenCalled();

    mocks.dataDeletes.mockClear();
    expect(await processAccountDeletion(USER)).toBe("completed");
    expect(mocks.dataDeletes).not.toHaveBeenCalled();
    expect(mocks.authDelete).toHaveBeenCalledTimes(1);
  });

  /**
   * Apple の障害・設定の不備でも、データの削除とログインの無効化は済ませる。
   * 取り消しだけを cron が再試行する。
   */
  it("Apple の取り消しが失敗しても、データと Auth は済ませ、取り消しだけ再試行する", async () => {
    mocks.appleRevoke.mockRejectedValueOnce(new Error("apple revoke: 503"));

    expect(await requestAccountDeletion(USER)).toBe("pending");
    expect(state.row).toMatchObject({
      dataDeletedAt: expect.any(Date),
      authDeletedAt: expect.any(Date),
      appleRevokedAt: null,
      completedAt: null,
      lastError: "apple revoke: 503",
    });

    mocks.authDelete.mockClear();
    expect(await processAccountDeletion(USER)).toBe("completed");
    expect(mocks.authDelete).not.toHaveBeenCalled();
    expect(mocks.appleRevoke).toHaveBeenCalledTimes(2);
  });

  /**
   * Auth を無効化できなかった後も、本人のログインに頼らず cron が終わらせる。
   */
  it("Auth が失敗しても、cron が残りを終える", async () => {
    mocks.authDelete.mockResolvedValueOnce({
      error: { status: 500, message: "auth down" },
    });

    expect(await requestAccountDeletion(USER)).toBe("pending");
    expect(state.row?.lastError).toBe("auth delete: auth down");

    expect(await processPendingAccountDeletions()).toEqual({
      processed: 1,
      completed: 1,
    });
    expect(state.row?.completedAt).toEqual(expect.any(Date));
    expect(mocks.storageRemove).toHaveBeenCalledTimes(1);
  });

  it("Auth が既に消えている（404）なら完了として扱う", async () => {
    mocks.authDelete.mockResolvedValue({
      error: { status: 404, message: "User not found" },
    });

    expect(await requestAccountDeletion(USER)).toBe("completed");
  });

  it("他の処理が貸し出し中なら工程を進めず pending を返す", async () => {
    mocks.storageRemove.mockResolvedValueOnce({ error: { message: "x" } });
    await requestAccountDeletion(USER);
    // 別の処理が今まさに進めている
    if (state.row) state.row.lastAttemptAt = new Date();
    mocks.authDelete.mockClear();

    expect(await processAccountDeletion(USER)).toBe("pending");
    expect(mocks.authDelete).not.toHaveBeenCalled();
  });

  it("受け付けていないユーザーには何もしない", async () => {
    expect(await processAccountDeletion(USER)).toBe("pending");
    expect(mocks.dataDeletes).not.toHaveBeenCalled();
  });
});

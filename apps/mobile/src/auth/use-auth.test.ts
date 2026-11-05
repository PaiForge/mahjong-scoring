import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listener: undefined as
    | ((
        event: string,
        session: { user: { id: string; app_metadata: object } } | null,
      ) => void)
    | undefined,
  dismissDeletionNotice: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (listener: typeof mocks.listener) => {
        mocks.listener = listener;
      },
    },
  },
}));
// account-api は React Native を読むので置き換える。読み直しの結果はこのテストで見ない
vi.mock("./account-api", () => ({
  fetchAccount: async () => ({ error: "network" }),
}));
vi.mock("./use-deletion-notice", () => ({
  dismissDeletionNotice: mocks.dismissDeletionNotice,
}));

await import("./use-auth");

function emit(event: string, userId: string | undefined): void {
  mocks.listener?.(
    event,
    userId === undefined ? null : { user: { id: userId, app_metadata: {} } },
  );
}

beforeEach(() => {
  emit("SIGNED_OUT", undefined);
  vi.clearAllMocks();
});

describe("ログインの状態の変化と退会の知らせ", () => {
  it("ゲストからログインしたら、退会の知らせを捨てる", () => {
    emit("SIGNED_IN", "user-b");
    expect(mocks.dismissDeletionNotice).toHaveBeenCalledOnce();
  });

  it("ログアウトしても捨てない（退会の後はゲストに戻って知らせを読む）", () => {
    emit("SIGNED_OUT", undefined);
    expect(mocks.dismissDeletionNotice).not.toHaveBeenCalled();
  });

  it("同じアカウントのトークンの更新では捨て直さない", () => {
    emit("SIGNED_IN", "user-b");
    vi.clearAllMocks();
    emit("TOKEN_REFRESHED", "user-b");
    expect(mocks.dismissDeletionNotice).not.toHaveBeenCalled();
  });
});

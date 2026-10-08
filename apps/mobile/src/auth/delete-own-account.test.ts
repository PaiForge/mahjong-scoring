import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionUserId: "user-a" as string | undefined,
  callMobileApi: vi.fn(),
  signOut: vi.fn(),
  notifyAccountDeleted: vi.fn(),
  showDeletionNotice: vi.fn(),
  requestAppleAuthorizationCode: vi.fn(),
}));

vi.mock("./supabase-client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session:
            mocks.sessionUserId === undefined
              ? null
              : { user: { id: mocks.sessionUserId } },
        },
      }),
      signOut: mocks.signOut,
    },
  },
}));
// api-client は React Native を読むので、使う関数だけを置き換える
vi.mock("./api-client", () => {
  const errorOf = async (response: Response): Promise<unknown> => {
    const body: unknown = await response.json().catch(() => undefined);
    return typeof body === "object" && body !== null && "error" in body
      ? body.error
      : undefined;
  };
  return {
    callMobileApi: mocks.callMobileApi,
    notifyAccountDeleted: mocks.notifyAccountDeleted,
    errorOf,
    apiFailureOf: async () => "unknown",
  };
});
vi.mock("./use-deletion-notice", () => ({
  showDeletionNotice: mocks.showDeletionNotice,
}));
vi.mock("./apple-sign-in", () => ({
  requestAppleAuthorizationCode: mocks.requestAppleAuthorizationCode,
}));

import { deleteOwnAccount } from "./account-api";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessionUserId = "user-a";
  mocks.callMobileApi.mockResolvedValue(json(200, { status: "completed" }));
});

describe("deleteOwnAccount", () => {
  it("送る前のユーザーの名義で送り、そのユーザーの端末の記録を消してログアウトする", async () => {
    expect(await deleteOwnAccount()).toEqual({
      success: true,
      status: "completed",
    });
    expect(mocks.callMobileApi).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ asUser: "user-a" }),
    );
    expect(mocks.notifyAccountDeleted).toHaveBeenCalledWith("user-a");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("応答を待つ間に別のユーザーへ切り替わっても、そのユーザーをログアウトさせず記録も消さない", async () => {
    mocks.callMobileApi.mockImplementation(async () => {
      mocks.sessionUserId = "user-b";
      return json(200, { status: "pending" });
    });

    await deleteOwnAccount();

    expect(mocks.notifyAccountDeleted).toHaveBeenCalledWith("user-a");
    expect(mocks.notifyAccountDeleted).not.toHaveBeenCalledWith("user-b");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("Apple での確認を求められたら、得た認可コードを付けて送り直す", async () => {
    mocks.callMobileApi
      .mockResolvedValueOnce(json(409, { error: "appleAuthorizationRequired" }))
      .mockResolvedValueOnce(json(200, { status: "completed" }));
    mocks.requestAppleAuthorizationCode.mockResolvedValue({
      authorizationCode: "code-1",
    });

    expect(await deleteOwnAccount()).toMatchObject({ success: true });
    expect(mocks.callMobileApi).toHaveBeenLastCalledWith(expect.any(String), {
      method: "POST",
      body: { appleAuthorizationCode: "code-1" },
      asUser: "user-a",
    });
  });

  it("Apple のシートを閉じたら、退会もログアウトもしない", async () => {
    mocks.callMobileApi.mockResolvedValueOnce(
      json(409, { error: "appleAuthorizationRequired" }),
    );
    mocks.requestAppleAuthorizationCode.mockResolvedValue("canceled");

    expect(await deleteOwnAccount()).toEqual({ error: "appleCanceled" });
    expect(mocks.callMobileApi).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.notifyAccountDeleted).not.toHaveBeenCalled();
  });

  it("別の Apple ID で確認したら appleRejected を返す", async () => {
    mocks.callMobileApi
      .mockResolvedValueOnce(json(409, { error: "appleAuthorizationRequired" }))
      .mockResolvedValueOnce(json(422, { error: "appleRejected" }));
    mocks.requestAppleAuthorizationCode.mockResolvedValue({
      authorizationCode: "other",
    });

    expect(await deleteOwnAccount()).toEqual({ error: "appleRejected" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetAccountLoginState,
  mockEnsureEmailIdentity,
  mockRevokeAppleToken,
  mockGetUserIdentities,
  mockUnlinkIdentity,
  mockLogActivityEvent,
} = vi.hoisted(() => ({
  mockGetAccountLoginState: vi.fn(),
  mockEnsureEmailIdentity: vi.fn(),
  mockRevokeAppleToken: vi.fn(),
  mockGetUserIdentities: vi.fn(),
  mockUnlinkIdentity: vi.fn(),
  mockLogActivityEvent: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/users/login-methods", () => ({
  getAccountLoginState: mockGetAccountLoginState,
  ensureEmailIdentity: mockEnsureEmailIdentity,
}));
vi.mock("@/lib/apple/refresh-tokens", () => ({
  revokeAppleTokenForUnlink: mockRevokeAppleToken,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUserIdentities: mockGetUserIdentities,
      unlinkIdentity: mockUnlinkIdentity,
    },
  }),
}));
vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));
vi.mock("@/lib/log-error", () => ({ logExternalError: vi.fn() }));

import {
  AUTHENTICATED_USER as USER,
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";

import { unlinkLoginIdentity } from "../unlink-login-identity";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const google = { id: "id-google", provider: "google", email: "a@gmail.com" };
const apple = {
  id: "id-apple",
  provider: "apple",
  email: "x@privaterelay.appleid.com",
};

/** 認証サーバーが返す連携（`identity_id` が features 側の `id`） */
function serverIdentities(...ids: readonly string[]) {
  return {
    data: { identities: ids.map((identity_id) => ({ identity_id })) },
    error: null,
  };
}

function loginState(overrides: {
  readonly identities?: readonly (typeof google)[];
  readonly hasPassword?: boolean;
  readonly appleSubjects?: ReadonlyMap<string, string>;
}) {
  return {
    email: USER.email,
    pendingEmail: undefined,
    identities: overrides.identities ?? [google],
    hasPassword: overrides.hasPassword ?? true,
    appleSubjects: overrides.appleSubjects ?? new Map<string, string>(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("unlinkLoginIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthorized();
    mockGetAccountLoginState.mockResolvedValue(loginState({}));
    mockEnsureEmailIdentity.mockResolvedValue(undefined);
    mockRevokeAppleToken.mockResolvedValue(undefined);
    mockGetUserIdentities.mockResolvedValue(serverIdentities(google.id));
    mockUnlinkIdentity.mockResolvedValue({ data: {}, error: null });
  });

  it("レートリミット超過・未ログイン・BAN は本体に入らない", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });
    expect(await unlinkLoginIdentity(google.id)).toEqual({
      error: "rateLimited",
    });
    expect(mockEnforceIpRateLimit).toHaveBeenCalledWith("unlinkLoginIdentity");

    mockEnforceIpRateLimit.mockResolvedValue(undefined);
    mockAuthenticateAndCheckBan.mockResolvedValue({ error: "banned" });
    expect(await unlinkLoginIdentity(google.id)).toEqual({ error: "banned" });
    expect(mockGetAccountLoginState).not.toHaveBeenCalled();
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
  });

  it("パスワードが無く唯一の Google は外さない（web の手段が残らない）", async () => {
    mockGetAccountLoginState.mockResolvedValue(
      loginState({ hasPassword: false }),
    );

    expect(await unlinkLoginIdentity(google.id)).toEqual({
      error: "removal:lastWebMethod",
    });
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
    expect(mockLogActivityEvent).not.toHaveBeenCalled();
  });

  it("無い連携は notLinked", async () => {
    expect(await unlinkLoginIdentity("id-unknown")).toEqual({
      error: "removal:notLinked",
    });
  });

  it("パスワードを持つ人は email の連携を補ってから外し、活動を記録する", async () => {
    const result = await unlinkLoginIdentity(google.id);

    expect(result).toEqual({ success: true });
    expect(mockEnsureEmailIdentity).toHaveBeenCalledWith(USER.id, USER.email, [
      google,
    ]);
    expect(mockUnlinkIdentity).toHaveBeenCalledWith({
      identity_id: google.id,
    });
    expect(mockLogActivityEvent).toHaveBeenCalledWith({
      userId: USER.id,
      action: "unlink_identity",
      metadata: { provider: "google" },
    });
    expect(mockRevokeAppleToken).not.toHaveBeenCalled();
  });

  it("パスワードが無ければ email の連携は補わない（別の Google が残る付け替え）", async () => {
    const googleB = { ...google, id: "id-google-b", email: "b@gmail.com" };
    mockGetAccountLoginState.mockResolvedValue(
      loginState({ identities: [google, googleB], hasPassword: false }),
    );
    mockGetUserIdentities.mockResolvedValue(
      serverIdentities(google.id, googleB.id),
    );

    expect(await unlinkLoginIdentity(google.id)).toEqual({ success: true });
    expect(mockEnsureEmailIdentity).not.toHaveBeenCalled();
  });

  it("Apple は預かったトークンを取り消してから外す", async () => {
    mockGetAccountLoginState.mockResolvedValue(
      loginState({
        identities: [google, apple],
        hasPassword: false,
        appleSubjects: new Map([[apple.id, "apple-sub"]]),
      }),
    );
    mockGetUserIdentities.mockResolvedValue(
      serverIdentities(google.id, apple.id),
    );

    expect(await unlinkLoginIdentity(apple.id)).toEqual({ success: true });
    expect(mockRevokeAppleToken).toHaveBeenCalledWith(USER.id, "apple-sub");
    expect(mockUnlinkIdentity).toHaveBeenCalledWith({
      identity_id: apple.id,
    });
  });

  it("Apple の取り消しが通らなければ外さない", async () => {
    mockGetAccountLoginState.mockResolvedValue(
      loginState({
        identities: [google, apple],
        appleSubjects: new Map([[apple.id, "apple-sub"]]),
      }),
    );
    mockRevokeAppleToken.mockRejectedValue(new Error("apple down"));

    expect(await unlinkLoginIdentity(apple.id)).toEqual({
      error: "appleUnavailable",
    });
    expect(mockUnlinkIdentity).not.toHaveBeenCalled();
  });

  it("認証サーバーが外さなければ unlinkFailed", async () => {
    mockUnlinkIdentity.mockResolvedValue({
      data: null,
      error: { code: "single_identity_not_deletable" },
    });

    expect(await unlinkLoginIdentity(google.id)).toEqual({
      error: "unlinkFailed",
    });
    expect(mockLogActivityEvent).not.toHaveBeenCalled();
  });
});

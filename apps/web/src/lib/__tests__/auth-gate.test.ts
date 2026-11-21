import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getAccountStanding: vi.fn(),
}));

// `cache()` はリクエスト境界の無いテストではメモ化しない素の関数にする
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/i18n/current-locale", () => ({ currentLocale: vi.fn() }));
vi.mock("../supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("../db/queries", () => ({ getProfileByUserId: vi.fn() }));
vi.mock("../ban", () => ({
  isUserBanned: vi.fn(),
  getAccountStanding: mocks.getAccountStanding,
}));

import { authenticateAndCheckBan } from "../auth";

const USER = { id: "user-1", email: "a@example.com", app_metadata: {} };

function signedIn() {
  mocks.getUser.mockResolvedValue({ data: { user: USER }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  signedIn();
  mocks.getAccountStanding.mockResolvedValue("active");
});

describe("authenticateAndCheckBan", () => {
  it("認証済みで状態に問題が無ければユーザーを返す", async () => {
    expect(await authenticateAndCheckBan()).toEqual({
      user: { id: "user-1", email: "a@example.com", provider: undefined },
    });
  });

  it("cookie が無ければ未認証", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400 },
    });

    expect(await authenticateAndCheckBan()).toEqual({ error: "unauthorized" });
  });

  it("認証サーバーが無効と答えたトークンは未認証", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 403 },
    });

    expect(await authenticateAndCheckBan()).toEqual({ error: "unauthorized" });
  });

  it("認証サーバーに届かなければ、未認証ではなく serviceUnavailable", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    expect(await authenticateAndCheckBan()).toEqual({
      error: "serviceUnavailable",
    });
    expect(mocks.getAccountStanding).not.toHaveBeenCalled();
  });

  it("認証サーバーの障害（5xx）も serviceUnavailable", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 503 },
    });

    expect(await authenticateAndCheckBan()).toEqual({
      error: "serviceUnavailable",
    });
  });

  it("認証の問い合わせが投げても、投げずに serviceUnavailable を返す", async () => {
    mocks.getUser.mockRejectedValue(new Error("boom"));

    expect(await authenticateAndCheckBan()).toEqual({
      error: "serviceUnavailable",
    });
  });

  it("アカウントの状態を DB から読めなければ、投げずに serviceUnavailable を返す", async () => {
    mocks.getAccountStanding.mockRejectedValue(new Error("connection refused"));

    expect(await authenticateAndCheckBan()).toEqual({
      error: "serviceUnavailable",
    });
  });

  it("BAN は banned", async () => {
    mocks.getAccountStanding.mockResolvedValue("banned");

    expect(await authenticateAndCheckBan()).toEqual({ error: "banned" });
  });

  it("退会を受け付けたユーザーは未認証", async () => {
    mocks.getAccountStanding.mockResolvedValue("deleting");

    expect(await authenticateAndCheckBan()).toEqual({ error: "unauthorized" });
  });

  describe("退会の受付（forAccountDeletion）", () => {
    it("アカウントの状態を読まずに通す（DB が落ちていても受け付けへ進める）", async () => {
      mocks.getAccountStanding.mockRejectedValue(new Error("down"));

      expect(
        await authenticateAndCheckBan({ forAccountDeletion: true }),
      ).toMatchObject({ user: { id: "user-1" } });
      expect(mocks.getAccountStanding).not.toHaveBeenCalled();
    });

    it("認証サーバーに届かなければ serviceUnavailable", async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthRetryableFetchError("fetch failed", 0),
      });

      expect(
        await authenticateAndCheckBan({ forAccountDeletion: true }),
      ).toEqual({ error: "serviceUnavailable" });
    });
  });
});

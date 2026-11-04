// @vitest-environment node
/**
 * 認証コールバックのテスト（Google の追加の戻り・メールアドレス変更の確認）
 *
 * @description
 * - `link=google`: 成功はアカウントのページへ `linkedGoogle`、重複は `linkDuplicate`、
 *   それ以外の失敗は `linkFailed`。成功時の活動記録は `link_identity` だけで、
 *   ログインの着地（`login` の記録・プロフィールの照会）を通らない
 * - `type=email_change`: 1 通目（セッション無し）は `emailChangePending`、2 通目は
 *   `emailChangeDone`、無効なリンクはログイン中なら `emailChangeLinkInvalid`。
 *   未ログインはサインインへ送る
 */
import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockExchangeCodeForSession,
  mockVerifyOtp,
  mockGetUser,
  mockGetOptionalUser,
  mockLogActivityEvent,
  mockGetProfileByUserId,
} = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockGetUser: vi.fn(),
  mockGetOptionalUser: vi.fn(),
  mockLogActivityEvent: vi.fn(),
  mockGetProfileByUserId: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
      getUser: mockGetUser,
    },
  }),
}));
vi.mock("@/lib/auth", () => ({ getOptionalUser: mockGetOptionalUser }));
vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));
vi.mock("@/lib/db/queries", () => ({
  getProfileByUserId: mockGetProfileByUserId,
}));

import { GET } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORIGIN = "http://localhost:3000";
const USER_ID = "user-1";
const SESSION = { user: { id: USER_ID } };

function callback(query: string) {
  return GET(new Request(`${ORIGIN}/auth/callback?${query}`));
}

/** `NextResponse.redirect` に渡った着地 URL（1 回だけ呼ばれる前提） */
function redirectedTo(): string {
  const spy = vi.mocked(NextResponse.redirect);
  expect(spy).toHaveBeenCalledTimes(1);
  return String(spy.mock.calls[0]?.[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.spyOn(NextResponse, "redirect");
  mockGetOptionalUser.mockResolvedValue({ id: USER_ID });
  mockGetProfileByUserId.mockResolvedValue({ userId: USER_ID });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /auth/callback — Google の追加の戻り", () => {
  it("code を交換し、linkedGoogle を付けてアカウントのページへ送る", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: SESSION },
      error: null,
    });

    await callback("link=google&code=abc");

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(redirectedTo()).toBe(`${ORIGIN}/mypage/account?notice=linkedGoogle`);
  });

  it("活動記録は link_identity だけで、ログインの記録もプロフィールの照会もしない", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: SESSION },
      error: null,
    });

    await callback("link=google&code=abc");

    expect(mockLogActivityEvent).toHaveBeenCalledTimes(1);
    expect(mockLogActivityEvent).toHaveBeenCalledWith({
      userId: USER_ID,
      action: "link_identity",
      metadata: { provider: "google" },
    });
    expect(mockGetProfileByUserId).not.toHaveBeenCalled();
  });

  it("identity_already_exists なら linkDuplicate。交換は呼ばない", async () => {
    await callback(
      "link=google&error=server_error&error_code=identity_already_exists",
    );

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(redirectedTo()).toBe(
      `${ORIGIN}/mypage/account?notice=linkDuplicate`,
    );
  });

  it.each([
    ["Google で拒否された", "link=google&error=access_denied"],
    ["code が無い", "link=google"],
  ])("%s ときは linkFailed。交換は呼ばない", async (_label, query) => {
    await callback(query);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(redirectedTo()).toBe(`${ORIGIN}/mypage/account?notice=linkFailed`);
  });

  it("code の交換に失敗したら linkFailed。活動記録は付けない", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "invalid" },
    });

    await callback("link=google&code=abc");

    expect(redirectedTo()).toBe(`${ORIGIN}/mypage/account?notice=linkFailed`);
    expect(mockLogActivityEvent).not.toHaveBeenCalled();
  });
});

describe("GET /auth/callback — メールアドレス変更の確認", () => {
  const QUERY = "token_hash=th&type=email_change";

  it("token_hash と type を verifyOtp へ渡し、code の交換は呼ばない", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: SESSION },
      error: null,
    });

    await callback(`${QUERY}&code=abc`);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "th",
      type: "email_change",
    });
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  describe("1 通目（セッションが出ない）", () => {
    beforeEach(() => {
      mockVerifyOtp.mockResolvedValue({
        data: { session: null },
        error: null,
      });
    });

    it("ログイン中なら emailChangePending を付けてアカウントのページへ", async () => {
      await callback(QUERY);

      expect(redirectedTo()).toBe(
        `${ORIGIN}/mypage/account?notice=emailChangePending`,
      );
      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });

    it("未ログインならログインの後にアカウントのページへ戻すようサインインへ", async () => {
      mockGetOptionalUser.mockResolvedValue(null);

      await callback(QUERY);

      const url = new URL(redirectedTo());
      expect(url.pathname).toBe("/sign-in");
      expect(url.searchParams.get("redirect")).toBe(
        "/mypage/account?notice=emailChangePending",
      );
    });
  });

  it("2 通目（セッションが出る）は emailChangeDone。活動記録は change_email", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: SESSION },
      error: null,
    });

    await callback(QUERY);

    expect(redirectedTo()).toBe(
      `${ORIGIN}/mypage/account?notice=emailChangeDone`,
    );
    expect(mockLogActivityEvent).toHaveBeenCalledWith({
      userId: USER_ID,
      action: "change_email",
    });
  });

  describe("リンクが無効", () => {
    beforeEach(() => {
      mockVerifyOtp.mockResolvedValue({
        data: { session: null },
        error: { message: "expired" },
      });
    });

    it("ログイン中なら emailChangeLinkInvalid を付けてアカウントのページへ", async () => {
      await callback(QUERY);

      expect(redirectedTo()).toBe(
        `${ORIGIN}/mypage/account?notice=emailChangeLinkInvalid`,
      );
    });

    it("未ログインならサインインへ email_link_invalid を付けて送る", async () => {
      mockGetOptionalUser.mockResolvedValue(null);

      await callback(QUERY);

      expect(redirectedTo()).toBe(`${ORIGIN}/sign-in?error=email_link_invalid`);
      expect(mockLogActivityEvent).not.toHaveBeenCalled();
    });
  });
});

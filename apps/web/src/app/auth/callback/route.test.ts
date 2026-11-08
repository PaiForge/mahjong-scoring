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
 * - `locale`: 入口が付けた言語で固定の着地を組む。`locale=en` なら英語で公開している
 *   ページ（setup-username・再設定・サインイン・マイページ・アカウントのページ）は
 *   `/en/...`。`next` は言語付きのまま使う。無い・不正な値は日本語（従来の着地）
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

describe("GET /auth/callback — 着地の言語（locale）", () => {
  const SIGNED_IN = { data: { session: SESSION }, error: null };

  it("locale=en でプロフィールが無ければ、next を捨てて英語のユーザー名の設定へ", async () => {
    mockExchangeCodeForSession.mockResolvedValue(SIGNED_IN);
    mockGetProfileByUserId.mockResolvedValue(undefined);

    await callback("code=abc&locale=en&next=%2Fen%2Fmypage");

    expect(redirectedTo()).toBe(`${ORIGIN}/en/mypage/setup-username`);
  });

  it("locale=en でプロフィールがあれば、言語付きの next へそのまま送る", async () => {
    mockExchangeCodeForSession.mockResolvedValue(SIGNED_IN);

    await callback("code=abc&locale=en&next=%2Fen%2Fpractice%2Fjantou-fu");

    expect(redirectedTo()).toBe(`${ORIGIN}/en/practice/jantou-fu`);
  });

  it("locale=en で next が無ければ英語のマイページへ", async () => {
    mockVerifyOtp.mockResolvedValue(SIGNED_IN);

    await callback("token_hash=th&type=signup&locale=en");

    expect(redirectedTo()).toBe(`${ORIGIN}/en/mypage`);
  });

  it.each([
    ["token_hash の再設定", "token_hash=th&type=recovery&locale=en"],
    ["PKCE の再設定", "code=abc&type=recovery&locale=en"],
  ])("locale=en の%sは英語の再設定のページへ", async (_label, query) => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });
    mockExchangeCodeForSession.mockResolvedValue(SIGNED_IN);

    await callback(query);

    expect(redirectedTo()).toBe(`${ORIGIN}/en/reset-password`);
  });

  it("locale=en で認証に失敗したら英語のサインインへ auth_callback_error を付けて送る", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: null },
      error: { message: "invalid" },
    });

    await callback("token_hash=th&type=signup&locale=en");

    expect(redirectedTo()).toBe(
      `${ORIGIN}/en/sign-in?error=auth_callback_error`,
    );
  });

  it("locale=en でメールのリンクが無効なら、未ログインは英語のサインインへ email_link_invalid", async () => {
    mockGetOptionalUser.mockResolvedValue(null);

    await callback("error=access_denied&error_code=otp_expired&locale=en");

    expect(redirectedTo()).toBe(
      `${ORIGIN}/en/sign-in?error=email_link_invalid`,
    );
  });

  it("locale=en のメールアドレス変更の完了は英語のアカウントのページへ報せ付きで", async () => {
    mockVerifyOtp.mockResolvedValue(SIGNED_IN);

    await callback("token_hash=th&type=email_change&locale=en");

    expect(redirectedTo()).toBe(
      `${ORIGIN}/en/mypage/account?notice=emailChangeDone`,
    );
  });

  it("locale=en のメールアドレス変更の 1 通目は、未ログインなら英語のサインインへ英語のアカウントのページを戻り先にして", async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: null });
    mockGetOptionalUser.mockResolvedValue(null);

    await callback("token_hash=th&type=email_change&locale=en");

    const url = new URL(redirectedTo());
    expect(url.pathname).toBe("/en/sign-in");
    expect(url.searchParams.get("redirect")).toBe(
      "/en/mypage/account?notice=emailChangePending",
    );
  });

  it("locale=en の Google の追加の戻りは英語のアカウントのページへ", async () => {
    await callback("link=google&error=access_denied&locale=en");

    expect(redirectedTo()).toBe(
      `${ORIGIN}/en/mypage/account?notice=linkFailed`,
    );
  });

  it.each([
    ["locale が無い", "token_hash=th&type=recovery"],
    ["対応していない locale", "token_hash=th&type=recovery&locale=fr"],
    ["接頭辞の形の locale", "token_hash=th&type=recovery&locale=%2Fen"],
    ["大文字の locale", "token_hash=th&type=recovery&locale=EN"],
    ["既定の言語の locale", "token_hash=th&type=recovery&locale=ja"],
  ])("%s ときは日本語の着地（接頭辞なし）", async (_label, query) => {
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });

    await callback(query);

    expect(redirectedTo()).toBe(`${ORIGIN}/reset-password`);
  });

  it("locale が不正なら、プロフィールが無いときも日本語のユーザー名の設定へ", async () => {
    mockExchangeCodeForSession.mockResolvedValue(SIGNED_IN);
    mockGetProfileByUserId.mockResolvedValue(undefined);

    await callback("code=abc&locale=fr");

    expect(redirectedTo()).toBe(`${ORIGIN}/mypage/setup-username`);
  });

  it("locale=ja（日本語のボタン・OAuth）の成功は従来どおりのマイページへ", async () => {
    mockExchangeCodeForSession.mockResolvedValue(SIGNED_IN);

    await callback("code=abc&locale=ja&next=%2Fmypage");

    expect(redirectedTo()).toBe(`${ORIGIN}/mypage`);
  });
});

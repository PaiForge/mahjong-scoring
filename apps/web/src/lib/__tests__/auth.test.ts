import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  currentLocale: vi.fn(),
  getProfileByUserId: vi.fn(),
  isUserBanned: vi.fn(),
}));

// `cache()` はリクエスト境界の無いテストではメモ化しない素の関数にする
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

/** Next の redirect と同じく例外で抜ける。投げた値から飛ばし先を読む */
class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));
vi.mock("@/i18n/current-locale", () => ({
  currentLocale: mocks.currentLocale,
}));
vi.mock("../supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mocks.getClaims } }),
}));
vi.mock("../db/queries", () => ({
  getProfileByUserId: mocks.getProfileByUserId,
}));
vi.mock("../ban", () => ({
  isUserBanned: mocks.isUserBanned,
  getAccountStanding: vi.fn(),
}));

import {
  getAuthenticatedUser,
  redirectIfAuthenticated,
  requireConfirmedUser,
  requireProvisionalUser,
} from "../auth";

const CLAIMS = { sub: "user-1", email: "a@example.com" };

/** ガードを呼び、飛ばし先を返す（飛ばさなければ undefined） */
async function redirectedTo(run: () => Promise<unknown>) {
  try {
    await run();
    return undefined;
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
}

function signedOut() {
  mocks.getClaims.mockResolvedValue({ data: null, error: null });
}

function signedIn() {
  mocks.getClaims.mockResolvedValue({
    data: { claims: CLAIMS },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentLocale.mockResolvedValue("ja");
  mocks.getProfileByUserId.mockResolvedValue({ username: "taro" });
  mocks.isUserBanned.mockResolvedValue(false);
});

describe("getAuthenticatedUser", () => {
  it("未認証で戻り先を省くと、従来どおり日本語の /sign-in（?redirect= なし）", async () => {
    signedOut();
    expect(await redirectedTo(() => getAuthenticatedUser())).toBe("/sign-in");
  });

  it("英語のページでは /en/sign-in へ飛ばす", async () => {
    signedOut();
    mocks.currentLocale.mockResolvedValue("en");
    expect(await redirectedTo(() => getAuthenticatedUser())).toBe(
      "/en/sign-in",
    );
  });

  it("戻り先を渡すと ?redirect= に載せ、/en を二重に付けない", async () => {
    signedOut();
    mocks.currentLocale.mockResolvedValue("en");
    expect(
      await redirectedTo(() =>
        getAuthenticatedUser({ returnTo: "/en/mypage/plan" }),
      ),
    ).toBe("/en/sign-in?redirect=%2Fen%2Fmypage%2Fplan");
  });

  it("日本語のページの戻り先は接頭辞なしのまま", async () => {
    signedOut();
    expect(
      await redirectedTo(() => getAuthenticatedUser({ returnTo: "/mypage" })),
    ).toBe("/sign-in?redirect=%2Fmypage");
  });

  it("claims の取得が失敗したら未認証として扱う", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: CLAIMS },
      error: new Error("invalid"),
    });
    expect(await redirectedTo(() => getAuthenticatedUser())).toBe("/sign-in");
  });

  it("認証済みならユーザーを返し、言語を読まない", async () => {
    signedIn();
    const user = await getAuthenticatedUser({ returnTo: "/en/mypage" });
    expect(user.id).toBe("user-1");
    expect(mocks.currentLocale).not.toHaveBeenCalled();
  });
});

describe("requireConfirmedUser", () => {
  it("未認証は今の言語のサインインへ、戻り先付きで飛ばす", async () => {
    signedOut();
    mocks.currentLocale.mockResolvedValue("en");
    expect(
      await redirectedTo(() =>
        requireConfirmedUser({ returnTo: "/en/dashboard" }),
      ),
    ).toBe("/en/sign-in?redirect=%2Fen%2Fdashboard");
  });

  it.each([
    ["ja", "/banned"],
    ["en", "/en/banned"],
  ] as const)("BAN は %s の /banned へ飛ばす", async (locale, expected) => {
    signedIn();
    mocks.currentLocale.mockResolvedValue(locale);
    mocks.isUserBanned.mockResolvedValue(true);
    expect(await redirectedTo(() => requireConfirmedUser())).toBe(expected);
  });

  it.each([
    ["ja", "/mypage/setup-username"],
    ["en", "/en/mypage/setup-username"],
  ] as const)(
    "プロフィール未作成は %s の setup-username へ飛ばす",
    async (locale, expected) => {
      signedIn();
      mocks.currentLocale.mockResolvedValue(locale);
      mocks.getProfileByUserId.mockResolvedValue(undefined);
      expect(await redirectedTo(() => requireConfirmedUser())).toBe(expected);
    },
  );

  it("本登録済みならユーザーとプロフィールを返す", async () => {
    signedIn();
    const { user, profile } = await requireConfirmedUser();
    expect(user.id).toBe("user-1");
    expect(profile).toEqual({ username: "taro" });
  });
});

describe("requireProvisionalUser", () => {
  it.each([
    ["ja", "/mypage"],
    ["en", "/en/mypage"],
  ] as const)(
    "プロフィール作成済みは %s のマイページへ飛ばす",
    async (locale, expected) => {
      signedIn();
      mocks.currentLocale.mockResolvedValue(locale);
      expect(await redirectedTo(() => requireProvisionalUser())).toBe(expected);
    },
  );

  it("BAN は今の言語の /banned へ飛ばす", async () => {
    signedIn();
    mocks.currentLocale.mockResolvedValue("en");
    mocks.isUserBanned.mockResolvedValue(true);
    expect(await redirectedTo(() => requireProvisionalUser())).toBe(
      "/en/banned",
    );
  });

  it("未認証は戻り先付きでサインインへ飛ばす", async () => {
    signedOut();
    expect(
      await redirectedTo(() =>
        requireProvisionalUser({ returnTo: "/mypage/setup-username" }),
      ),
    ).toBe("/sign-in?redirect=%2Fmypage%2Fsetup-username");
  });

  it("仮登録ならユーザーを返す", async () => {
    signedIn();
    mocks.getProfileByUserId.mockResolvedValue(undefined);
    const { user } = await requireProvisionalUser();
    expect(user.id).toBe("user-1");
  });
});

describe("redirectIfAuthenticated", () => {
  it("退避先を省くと、日本語は従来どおり /mypage", async () => {
    signedIn();
    expect(await redirectedTo(() => redirectIfAuthenticated())).toBe("/mypage");
  });

  it("退避先を省くと、英語は /en/mypage", async () => {
    signedIn();
    mocks.currentLocale.mockResolvedValue("en");
    expect(await redirectedTo(() => redirectIfAuthenticated())).toBe(
      "/en/mypage",
    );
  });

  it("退避先を渡すとそのまま使う", async () => {
    signedIn();
    mocks.currentLocale.mockResolvedValue("en");
    expect(
      await redirectedTo(() => redirectIfAuthenticated("/en/dashboard")),
    ).toBe("/en/dashboard");
  });

  it("未ログインなら飛ばさない", async () => {
    signedOut();
    expect(await redirectedTo(() => redirectIfAuthenticated())).toBeUndefined();
  });
});

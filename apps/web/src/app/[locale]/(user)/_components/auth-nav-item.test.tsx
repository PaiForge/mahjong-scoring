/**
 * AuthNavItem のアカウント表示テスト
 *
 * @description
 * - アバター設定済み: ヘッダーにアバター画像を出す
 * - アバター未設定: 既定のユーザーアイコンを出す
 * - プロフィール取得中: アイコン → アバターの差し替わりを見せないためスケルトンを続ける
 * - 未ログイン: ログイン / 新規登録の導線を出す
 * - 英語のページ: 英語で公開しているログイン・登録・マイページ・設定は `/en` の
 *   リンクで、英語版の無い先は日本語のページへ「日本語のみ」と添えて向ける
 * - ログアウト: 今の言語のトップ（日本語は `/`、英語は `/en`）へ送り、着いた先で
 *   完了のトーストを出す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth as mockUseAuth } from "@/test/auth-context-mock";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { routerPush } from "@/test/navigation-mock";
import { takeToastOnArrival } from "@/app/_components/_lib/toast-on-arrival";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

// 公開 href の表（locale-link-table）が読む next-intl のナビゲーションは、
// モジュールの評価時に redirect / permanentRedirect を束ねる
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("next/link", async () => await import("@/test/next-link-mock"));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { readonly src: string; readonly alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import { LOCALE_LINK_TABLE } from "./_lib/locale-link-table";
import { AuthNavItem } from "./auth-nav-item";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 日本語のページ（表は日本語のリンクに影響しないので空でよい） */
const JA_LINKS = { locale: "ja", table: {} } as const;
/** 英語のページ（今の公開状態の表。ログイン・登録・マイページ・設定は英語で公開している） */
const EN_LINKS = { locale: "en", table: LOCALE_LINK_TABLE } as const;
/** 英語のページで、ログイン・マイページ・設定を英語で公開していない表 */
const EN_LINKS_WITHOUT_MEMBER_PAGES = { locale: "en", table: {} } as const;

/** アカウントメニューを開いてログアウトを押し、`signOut` の完了まで待つ */
async function signOutFromMenu(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: "account" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("menuitem", { name: "signOut" }));
  });
}

function authState(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: "user-1" },
    isLoading: false,
    profile: { avatarUrl: null, name: "たろう" },
    isProfileLoading: false,
    signOut: vi.fn(),
    ...overrides,
  });
}

describe("AuthNavItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("アバター設定済みならアバター画像を出す", () => {
    authState({
      profile: {
        avatarUrl: "https://example.test/avatar.webp",
        name: "たろう",
      },
    });

    render(<AuthNavItem localeLinks={JA_LINKS} />);

    const image = screen.getByRole("img", { name: "たろう" });
    expect(image.getAttribute("src")).toBe("https://example.test/avatar.webp");
  });

  it("アバター未設定なら画像を出さない（既定のユーザーアイコン）", () => {
    authState();

    const { container } = render(<AuthNavItem localeLinks={JA_LINKS} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("プロフィール取得中はアカウントボタンを出さない", () => {
    authState({ isProfileLoading: true, profile: undefined });

    render(<AuthNavItem localeLinks={JA_LINKS} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("未ログインならログイン / 新規登録の導線を出す", () => {
    authState({ user: null, profile: undefined });

    const { container } = render(<AuthNavItem localeLinks={JA_LINKS} />);

    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual(["/sign-in", "/sign-up"]);
  });

  it("英語のページでは、未ログインのログイン / 新規登録の導線を英語のページへ向ける", () => {
    authState({ user: null, profile: undefined });

    const { container } = render(<AuthNavItem localeLinks={EN_LINKS} />);

    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/en/sign-in",
      "/en/sign-up",
    ]);
    for (const link of links) {
      expect(link.getAttribute("hrefLang")).toBeNull();
    }
  });

  it("英語のページのメニューは、英語のマイページ・設定へ印なしで向ける", () => {
    authState();

    const { container } = render(<AuthNavItem localeLinks={EN_LINKS} />);

    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/en/mypage",
      "/en/preferences",
    ]);
    for (const link of links) {
      expect(link.getAttribute("hrefLang")).toBeNull();
      expect(link.textContent).not.toContain("language.japaneseOnly");
    }
  });

  it("ログイン・登録の英語版が無い表では、未ログインの導線を出さない（英語の名前のまま日本語へ飛ばさない）", () => {
    authState({ user: null, profile: undefined });

    const { container } = render(
      <AuthNavItem localeLinks={EN_LINKS_WITHOUT_MEMBER_PAGES} />,
    );

    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("マイページ・設定の英語版が無い表では、メニューを日本語のページへ素のリンクで向けて日本語のみと示す", () => {
    authState();

    const { container } = render(
      <AuthNavItem localeLinks={EN_LINKS_WITHOUT_MEMBER_PAGES} />,
    );

    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/mypage",
      "/preferences",
    ]);
    for (const link of links) {
      expect(link.getAttribute("hrefLang")).toBe("ja");
      expect(link.textContent).toContain("language.japaneseOnly");
    }
  });

  it("日本語のページでログアウトすると日本語のトップへ送り、着いた先でトーストを出す", async () => {
    authState({ signOut: vi.fn().mockResolvedValue(undefined) });

    render(<AuthNavItem localeLinks={JA_LINKS} />);
    await signOutFromMenu();

    expect(routerPush).toHaveBeenCalledWith("/");
    expect(takeToastOnArrival("/")).toEqual({
      message: "signOutSuccess",
      tone: "success",
    });
  });

  it("英語のページでログアウトすると英語のトップ（/en）へ送り、着いた先でトーストを出す", async () => {
    authState({ signOut: vi.fn().mockResolvedValue(undefined) });

    render(<AuthNavItem localeLinks={EN_LINKS} />);
    await signOutFromMenu();

    expect(routerPush).toHaveBeenCalledWith("/en");
    // 着地の判定はアドレスバーの形（`/en`）から接頭辞を外して比べる
    expect(takeToastOnArrival("/en")).toEqual({
      message: "signOutSuccess",
      tone: "success",
    });
  });
});

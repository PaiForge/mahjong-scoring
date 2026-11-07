/**
 * AuthNavItem のアカウント表示テスト
 *
 * @description
 * - アバター設定済み: ヘッダーにアバター画像を出す
 * - アバター未設定: 既定のユーザーアイコンを出す
 * - プロフィール取得中: アイコン → アバターの差し替わりを見せないためスケルトンを続ける
 * - 未ログイン: ログイン / 新規登録の導線を出す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth as mockUseAuth } from "@/test/auth-context-mock";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

vi.mock("next/link", async () => await import("@/test/next-link-mock"));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { readonly src: string; readonly alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import { AuthNavItem } from "./auth-nav-item";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 日本語のページ（表は日本語のリンクに影響しないので空でよい） */
const JA_LINKS = { locale: "ja", table: {} } as const;
/** 英語のページ（ログイン・マイページ・設定は英語で公開していない） */
const EN_LINKS = { locale: "en", table: {} } as const;

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

  it("英語のページでは、英語版の無いログイン / 新規登録の導線を出さない", () => {
    authState({ user: null, profile: undefined });

    const { container } = render(<AuthNavItem localeLinks={EN_LINKS} />);

    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("英語のページのメニューは、日本語のページへ素のリンクで向けて日本語のみと示す", () => {
    authState();

    const { container } = render(<AuthNavItem localeLinks={EN_LINKS} />);

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
});

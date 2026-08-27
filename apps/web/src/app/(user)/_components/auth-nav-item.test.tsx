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
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn() } }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => <a href={href}>{children}</a>,
}));

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

    render(<AuthNavItem />);

    const image = screen.getByRole("img", { name: "たろう" });
    expect(image.getAttribute("src")).toBe("https://example.test/avatar.webp");
  });

  it("アバター未設定なら画像を出さない（既定のユーザーアイコン）", () => {
    authState();

    const { container } = render(<AuthNavItem />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("プロフィール取得中はアカウントボタンを出さない", () => {
    authState({ isProfileLoading: true, profile: undefined });

    render(<AuthNavItem />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("未ログインならログイン / 新規登録の導線を出す", () => {
    authState({ user: null, profile: undefined });

    const { container } = render(<AuthNavItem />);

    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual(["/sign-in", "/sign-up"]);
  });
});

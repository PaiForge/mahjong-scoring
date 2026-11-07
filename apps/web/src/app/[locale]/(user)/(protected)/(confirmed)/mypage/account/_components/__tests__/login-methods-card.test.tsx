/**
 * ログイン方法カードのテスト
 *
 * @description
 * - パスワードの行: 未設定なら「設定」、設定済みなら「変更」
 * - 連携の行: `email` 以外の連携を 1 本ずつ出す（同じ Google が 2 本なら 2 行）
 * - 外せない連携: ボタンを無効にし、行の下に理由を出す
 * - 外す: 確認モーダルを挟み、確定したときだけ Server Action を呼ぶ。失敗の
 *   コードは辞書のキーに写してトーストに出し、読み直さない
 * - Google の追加: `/auth/callback?link=google` へ戻す `linkIdentity`
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LinkedIdentity } from "@mahjong-scoring/features/account/login-methods";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockReplace,
  mockToastSuccess,
  mockToastError,
  mockLinkIdentity,
  mockUnlinkLoginIdentity,
  mockRequestPasswordSetup,
  locale,
} = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockLinkIdentity: vi.fn(),
  mockUnlinkLoginIdentity: vi.fn(),
  mockRequestPasswordSetup: vi.fn(),
  locale: { current: "ja" as "ja" | "en" },
}));

vi.mock("next-intl", async () => ({
  ...(await import("@/test/intl-mock")),
  useLocale: () => locale.current,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { linkIdentity: mockLinkIdentity } }),
}));
vi.mock("../../_actions/unlink-login-identity", () => ({
  unlinkLoginIdentity: mockUnlinkLoginIdentity,
}));
vi.mock("../../_actions/request-password-setup", () => ({
  requestPasswordSetup: mockRequestPasswordSetup,
}));

import { LoginMethodsCard } from "../login-methods-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL = "user@example.com";
const emailIdentity: LinkedIdentity = {
  id: "id-email",
  provider: "email",
  email: EMAIL,
};
const google: LinkedIdentity = {
  id: "id-google",
  provider: "google",
  email: "a@gmail.com",
};
const google2: LinkedIdentity = {
  id: "id-google-2",
  provider: "google",
  email: "b@gmail.com",
};

function renderCard(props: {
  readonly identities: readonly LinkedIdentity[];
  readonly hasPassword: boolean;
}) {
  return render(
    <LoginMethodsCard {...props} email={EMAIL} relayBlocked={false} />,
  );
}

/** useTranslations のモックがキーをそのまま返すため、ボタンの名前 = 辞書キー */
function button(name: string): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>("button", { name });
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  locale.current = "ja";
  mockLinkIdentity.mockResolvedValue({ data: {}, error: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginMethodsCard の表示", () => {
  it("パスワードが無ければ「パスワードを設定」を出す", () => {
    renderCard({ identities: [google], hasPassword: false });

    expect(button("password.setup")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "password.change" })).toBe(
      null,
    );
  });

  it("パスワードがあれば「パスワードを変更」を出す", () => {
    renderCard({ identities: [emailIdentity], hasPassword: true });

    expect(button("password.change")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "password.setup" })).toBe(null);
  });

  it("email 以外の連携を 1 本ずつ出し、email の連携の行は出さない", () => {
    renderCard({
      identities: [emailIdentity, google, google2],
      hasPassword: true,
    });

    expect(screen.getAllByRole("button", { name: "remove" })).toHaveLength(2);
    expect(screen.getByText("a@gmail.com")).toBeTruthy();
    expect(screen.getByText("b@gmail.com")).toBeTruthy();
    // email の連携の行はパスワードの行と別に出さない（連携先のアドレスも出ない）
    expect(screen.queryByText(EMAIL)).toBe(null);
  });

  it("パスワード無し・Google 1 本なら「外す」を無効にし、理由を行の下に出す", () => {
    renderCard({ identities: [google], hasPassword: false });

    expect(button("remove").disabled).toBe(true);
    expect(screen.getByText("cannotRemove.lastWebMethod")).toBeTruthy();
  });

  it("ほかに web でログインできる手段があれば「外す」を押せ、理由も出さない", () => {
    renderCard({ identities: [google], hasPassword: true });

    expect(button("remove").disabled).toBe(false);
    expect(screen.queryByText("cannotRemove.lastWebMethod")).toBe(null);
  });
});

describe("LoginMethodsCard の「外す」", () => {
  const props = { identities: [google], hasPassword: true };

  it("確認モーダルでキャンセルしたら Server Action を呼ばない", async () => {
    renderCard(props);

    await click(button("remove"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await click(button("confirmRemove.cancel"));

    expect(mockUnlinkLoginIdentity).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBe(null);
  });

  it("確定すると連携の ID で外し、成功を報せて読み直す", async () => {
    mockUnlinkLoginIdentity.mockResolvedValue({ success: true });
    renderCard(props);

    await click(button("remove"));
    await click(button("confirmRemove.ok"));

    expect(mockUnlinkLoginIdentity).toHaveBeenCalledWith("id-google");
    expect(mockToastSuccess).toHaveBeenCalledWith("removedToast");
    expect(mockReplace).toHaveBeenCalledWith("/mypage/account");
  });

  it("英語のページでは同じ言語のアカウントのページを読み直す", async () => {
    locale.current = "en";
    mockUnlinkLoginIdentity.mockResolvedValue({ success: true });
    renderCard(props);

    await click(button("remove"));
    await click(button("confirmRemove.ok"));

    expect(mockReplace).toHaveBeenCalledWith("/en/mypage/account");
  });

  it("失敗のコードは辞書のキーに写してトーストに出し、読み直さない", async () => {
    mockUnlinkLoginIdentity.mockResolvedValue({
      error: "removal:lastWebMethod",
    });
    renderCard(props);

    await click(button("remove"));
    await click(button("confirmRemove.ok"));

    expect(mockToastError).toHaveBeenCalledWith("errors.removal:lastWebMethod");
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("LoginMethodsCard の「Google アカウントを追加」", () => {
  it("Google の連携を始め、戻り先を /auth/callback?link=google にする", async () => {
    renderCard({ identities: [emailIdentity], hasPassword: true });

    await click(button("google.add"));

    expect(mockLinkIdentity).toHaveBeenCalledTimes(1);
    const [args] = mockLinkIdentity.mock.calls[0] ?? [];
    expect(args.provider).toBe("google");
    const redirectTo = new URL(args.options.redirectTo);
    expect(redirectTo.origin).toBe(window.location.origin);
    expect(redirectTo.pathname).toBe("/auth/callback");
    expect(redirectTo.searchParams.get("link")).toBe("google");
    // 日本語では言語を運ばない（従来の戻り先のまま）
    expect(redirectTo.searchParams.has("locale")).toBe(false);
  });

  it("英語のページから始めたら、戻り先に locale=en を付けて同じ言語へ戻させる", async () => {
    locale.current = "en";
    renderCard({ identities: [emailIdentity], hasPassword: true });

    await click(button("google.add"));

    const [args] = mockLinkIdentity.mock.calls[0] ?? [];
    const redirectTo = new URL(args.options.redirectTo);
    expect(redirectTo.pathname).toBe("/auth/callback");
    expect(redirectTo.searchParams.get("link")).toBe("google");
    expect(redirectTo.searchParams.get("locale")).toBe("en");
  });
});

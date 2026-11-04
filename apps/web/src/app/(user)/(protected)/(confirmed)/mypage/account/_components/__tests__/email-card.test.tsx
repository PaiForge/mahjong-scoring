/**
 * メールアドレスカードのテスト
 *
 * @description
 * - 表示: 今のアドレス、変更の確認待ちがあれば「確認しています」の行
 * - 「変更する」: 同じカードの中に新しいアドレスの入力が開く
 * - 送信: 成功なら報せてフォームを閉じ、読み直す。失敗ならフォームを開いたまま
 *   辞書のキーに写したエラーを出す
 * - キャンセル: 入力とエラーを捨てて閉じる
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockReplace, mockToastSuccess, mockRequestEmailChange } = vi.hoisted(
  () => ({
    mockReplace: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockRequestEmailChange: vi.fn(),
  }),
);

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));
vi.mock("../../_actions/request-email-change", () => ({
  requestEmailChange: mockRequestEmailChange,
}));

import { EmailCard } from "../email-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL = "user@example.com";
const NEW_EMAIL = "new@example.com";

function renderCard(pendingEmail?: string) {
  return render(
    <EmailCard
      email={EMAIL}
      pendingEmail={pendingEmail}
      relayBlocked={false}
    />,
  );
}

/** useTranslations のモックがキーをそのまま返すため、ボタンの名前 = 辞書キー */
function button(name: string): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>("button", { name });
}

function input(): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>("newEmailLabel");
}

async function openAndSubmit(value: string) {
  fireEvent.click(button("change"));
  fireEvent.change(input(), { target: { value } });
  await act(async () => {
    fireEvent.click(button("submit"));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EmailCard の表示", () => {
  it("今のアドレスを出し、確認待ちが無ければ「確認しています」の行は出さない", () => {
    renderCard();

    expect(screen.getByText(EMAIL)).toBeTruthy();
    expect(screen.queryByRole("status")).toBe(null);
  });

  it("確認待ちのアドレスがあれば「確認しています」の行を出す", () => {
    renderCard(NEW_EMAIL);

    expect(screen.getByRole("status").textContent).toBe("pending");
  });

  it("「変更する」で同じカードの中に入力が開き、ボタンは隠れる", () => {
    renderCard();
    expect(screen.queryByLabelText("newEmailLabel")).toBe(null);

    fireEvent.click(button("change"));

    expect(input()).toBeTruthy();
    expect(screen.queryByRole("button", { name: "change" })).toBe(null);
  });
});

describe("EmailCard の送信", () => {
  it("成功なら報せてフォームを閉じ、アカウントのページを読み直す", async () => {
    mockRequestEmailChange.mockResolvedValue({ success: true });
    renderCard();

    await openAndSubmit(NEW_EMAIL);

    expect(mockRequestEmailChange).toHaveBeenCalledWith(NEW_EMAIL);
    expect(mockToastSuccess).toHaveBeenCalledWith("sentToast");
    expect(screen.queryByLabelText("newEmailLabel")).toBe(null);
    expect(mockReplace).toHaveBeenCalledWith("/mypage/account");
  });

  it("失敗ならフォームを開いたまま、辞書のキーに写したエラーを出す", async () => {
    mockRequestEmailChange.mockResolvedValue({ error: "emailUnavailable" });
    renderCard();

    await openAndSubmit(NEW_EMAIL);

    expect(input().value).toBe(NEW_EMAIL);
    expect(screen.getByText("errors.emailUnavailable")).toBeTruthy();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("キャンセルで入力とエラーを捨てて閉じる", async () => {
    mockRequestEmailChange.mockResolvedValue({ error: "emailUnavailable" });
    renderCard();
    await openAndSubmit(NEW_EMAIL);

    fireEvent.click(button("cancel"));
    expect(screen.queryByLabelText("newEmailLabel")).toBe(null);

    fireEvent.click(button("change"));
    expect(input().value).toBe("");
    expect(screen.queryByText("errors.emailUnavailable")).toBe(null);
  });
});

/**
 * OfferPurchaseButton のテスト
 *
 * @description
 * - 未ログイン: 料金ページの言語のサインインへ張り、戻り先も同じ言語の料金ページ
 *   （日本語は従来の `/sign-in?redirect=%2Fplan` のまま）
 * - ログイン済み: Checkout の作成に料金ページの言語を明示で渡す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
vi.mock("react-hot-toast", () => ({ toast: { error: mocks.toastError } }));
vi.mock(
  "../../../../(protected)/(confirmed)/mypage/plan/_actions/create-checkout-session",
  () => ({ createCheckoutSession: mocks.createCheckoutSession }),
);

import { OfferPurchaseButton } from "../offer-purchase-button";

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  mocks.createCheckoutSession.mockResolvedValue({ error: "checkoutFailed" });
});

describe("OfferPurchaseButton", () => {
  it("未ログインの日本語は従来どおり日本語のサインインへ料金ページを戻り先に張る", () => {
    render(<OfferPurchaseButton offer="pass" locale="ja" />);
    expect(
      screen
        .getByRole("link", { name: "offers.signInToBuy" })
        .getAttribute("href"),
    ).toBe("/sign-in?redirect=%2Fplan");
  });

  it("未ログインの英語は英語のサインインへ英語の料金ページを戻り先に張る", () => {
    render(<OfferPurchaseButton offer="pass" locale="en" />);
    expect(
      screen
        .getByRole("link", { name: "offers.signInToBuy" })
        .getAttribute("href"),
    ).toBe("/en/sign-in?redirect=%2Fen%2Fplan");
  });

  it.each(["ja", "en"] as const)(
    "ログイン済み（%s）は料金ページの言語を渡して Checkout を作る",
    async (locale) => {
      mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
      render(<OfferPurchaseButton offer="lifetime" locale={locale} />);
      fireEvent.click(screen.getByRole("button", { name: "offers.buy" }));
      await waitFor(() => {
        expect(mocks.createCheckoutSession).toHaveBeenCalledWith(
          "lifetime",
          locale,
        );
      });
      await waitFor(() => {
        expect(mocks.toastError).toHaveBeenCalledWith("errors.checkoutFailed");
      });
    },
  );
});

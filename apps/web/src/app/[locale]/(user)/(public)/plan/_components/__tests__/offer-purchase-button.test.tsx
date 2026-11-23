/**
 * OfferPurchaseButton のテスト
 *
 * @description
 * - 未ログイン: 料金ページの言語のサインインへ張り、戻り先も同じ言語の料金ページ
 *   （日本語は従来の `/sign-in?redirect=%2Fplan` のまま）
 * - ログイン済み: Checkout の作成に料金ページの言語を明示で渡す
 * - 解決中: ボタンもリンクも出さない（押せない）
 * - 有効な購入がある: ボタンの代わりに売り方ごとの状態を出す。付与だけ・取得失敗は
 *   ボタンを出す
 * - 有効な購入を理由に拒まれたら、状態を取り直す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  toastError: vi.fn(),
  useViewerPlan: vi.fn(),
  refresh: vi.fn(),
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

vi.mock("../viewer-plan-provider", () => ({
  useViewerPlan: mocks.useViewerPlan,
}));

import type { ViewerPlan } from "@/lib/billing/viewer-plan";

import { OfferPurchaseButton } from "../offer-purchase-button";

/** 購入の状態が解決済みのコンテキスト（`plan` 省略は未ログインか取得失敗） */
function resolvedPlan(plan?: ViewerPlan) {
  return { isPending: false, plan, refresh: mocks.refresh };
}

const SIGNED_IN = { user: { id: "u1" }, isLoading: false };
const PASS_BLOCK = {
  kind: "until",
  until: "2026-10-20T00:00:00.000Z",
  inUse: true,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  mocks.useViewerPlan.mockReturnValue(resolvedPlan());
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

  it("認証状態か購入の状態の解決中は、ボタンもリンクも出さない", () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.useViewerPlan.mockReturnValue({
      isPending: true,
      plan: undefined,
      refresh: mocks.refresh,
    });
    render(<OfferPurchaseButton offer="pass" locale="ja" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it.each([
    // [売らない理由, 売り方, 出る文言]
    [PASS_BLOCK, "pass", "offers.inUseUntil"],
    [PASS_BLOCK, "lifetime", "offers.availableAfter"],
    [{ ...PASS_BLOCK, inUse: false }, "pass", "offers.scheduled"],
    [{ ...PASS_BLOCK, inUse: false }, "lifetime", "offers.availableAfter"],
    [{ kind: "lifetime" }, "lifetime", "offers.inUse"],
    [{ kind: "lifetime" }, "pass", "offers.notNeeded"],
  ] as const)(
    "有効な購入（%o）がある間、%s のカードはボタンの代わりに %s を出す",
    (purchaseBlock, offer, label) => {
      mockUseAuth.mockReturnValue(SIGNED_IN);
      mocks.useViewerPlan.mockReturnValue(resolvedPlan({ purchaseBlock }));
      render(<OfferPurchaseButton offer={offer} locale="ja" />);
      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
    },
  );

  it("運営からの付与だけの人には購入ボタンを出す", () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.useViewerPlan.mockReturnValue(
      resolvedPlan({ purchaseBlock: { kind: "none" }, granted: {} }),
    );
    render(<OfferPurchaseButton offer="lifetime" locale="ja" />);
    expect(screen.getByRole("button", { name: "offers.buy" })).toBeTruthy();
  });

  it("購入の状態を取得できなかったログイン済みには購入ボタンを出す", () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    render(<OfferPurchaseButton offer="pass" locale="ja" />);
    expect(screen.getByRole("button", { name: "offers.buy" })).toBeTruthy();
  });

  it.each(["alreadyActive", "checkoutPending"] as const)(
    "有効な購入を理由に拒まれたら（%s）、文言を出して状態を取り直す",
    async (error) => {
      mockUseAuth.mockReturnValue(SIGNED_IN);
      mocks.createCheckoutSession.mockResolvedValue({ error });
      render(<OfferPurchaseButton offer="pass" locale="ja" />);
      fireEvent.click(screen.getByRole("button", { name: "offers.buy" }));
      await waitFor(() => {
        expect(mocks.toastError).toHaveBeenCalledWith(`errors.${error}`);
      });
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("それ以外の失敗では状態を取り直さない", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    render(<OfferPurchaseButton offer="pass" locale="ja" />);
    fireEvent.click(screen.getByRole("button", { name: "offers.buy" }));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("errors.checkoutFailed");
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

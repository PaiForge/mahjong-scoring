/**
 * ViewerPlanProvider / GrantedPlanNotice のテスト
 *
 * @description
 * - 未ログイン: 購入の状態を取りに行かず、すぐ解決済みになる
 * - ログイン済み: 取得が終わるまで解決中、終わったら状態を配る
 * - 取得失敗・サーバーから見て未ログイン（null）: 状態なしで解決済み（購入ボタンへ倒れる）
 * - `refresh()` で取り直す
 * - 付与中の案内: 付与だけの人に出し、有効な購入がボタンを止めている間は出さない
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

const mocks = vi.hoisted(() => ({ fetchViewerPlan: vi.fn() }));

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("@/app/_lib/viewer-plan", () => ({
  fetchViewerPlan: mocks.fetchViewerPlan,
}));

import { GrantedPlanNotice } from "../granted-plan-notice";
import { ViewerPlanProvider, useViewerPlan } from "../viewer-plan-provider";

const SIGNED_IN = { user: { id: "u1" }, isLoading: false };
const PASS_BLOCK = {
  kind: "until",
  until: "2026-10-20T00:00:00.000Z",
  inUse: true,
} as const;

/** コンテキストの中身を文字で出す（解決中 / 売らない理由の種類 / 状態なし）。ボタンで取り直す */
function Probe() {
  const { isPending, plan, refresh } = useViewerPlan();
  return (
    <>
      <p data-testid="probe">
        {isPending ? "pending" : (plan?.purchaseBlock.kind ?? "no-plan")}
      </p>
      <button type="button" onClick={() => void refresh()}>
        refresh
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <ViewerPlanProvider>
      <Probe />
      <GrantedPlanNotice locale="ja" />
    </ViewerPlanProvider>,
  );
}

function probeText(): string | null {
  return screen.getByTestId("probe").textContent;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  mocks.fetchViewerPlan.mockResolvedValue({ purchaseBlock: { kind: "none" } });
});

describe("ViewerPlanProvider", () => {
  it("認証状態の解決中は解決中のまま、状態を取りに行かない", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: true });
    renderProvider();
    expect(probeText()).toBe("pending");
    expect(mocks.fetchViewerPlan).not.toHaveBeenCalled();
  });

  it("未ログインは状態を取りに行かず、状態なしで解決済みになる", () => {
    renderProvider();
    expect(probeText()).toBe("no-plan");
    expect(mocks.fetchViewerPlan).not.toHaveBeenCalled();
  });

  it("ログイン済みは取得が終わるまで解決中で、終わったら状態を配る", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.fetchViewerPlan.mockResolvedValue({ purchaseBlock: PASS_BLOCK });
    renderProvider();
    expect(probeText()).toBe("pending");
    await waitFor(() => {
      expect(probeText()).toBe("until");
    });
    expect(mocks.fetchViewerPlan).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["取得失敗", undefined],
    ["サーバーから見て未ログイン", null],
  ])("%s は状態なしで解決済みになる", async (_name, result) => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.fetchViewerPlan.mockResolvedValue(result);
    renderProvider();
    await waitFor(() => {
      expect(probeText()).toBe("no-plan");
    });
  });

  it("refresh() で取り直した状態に替わる", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    renderProvider();
    await waitFor(() => {
      expect(probeText()).toBe("none");
    });
    mocks.fetchViewerPlan.mockResolvedValue({ purchaseBlock: PASS_BLOCK });
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => {
      expect(probeText()).toBe("until");
    });
    expect(mocks.fetchViewerPlan).toHaveBeenCalledTimes(2);
  });
});

describe("GrantedPlanNotice", () => {
  it("期限付きの付与だけの人に、付与中の案内を出す", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.fetchViewerPlan.mockResolvedValue({
      purchaseBlock: { kind: "none" },
      granted: { until: "2026-10-31T00:00:00.000Z" },
    });
    renderProvider();
    expect(await screen.findByText("offers.grantedNotice")).toBeTruthy();
  });

  it("無期限の付与は無期限の文言で出す", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.fetchViewerPlan.mockResolvedValue({
      purchaseBlock: { kind: "none" },
      granted: {},
    });
    renderProvider();
    expect(
      await screen.findByText("offers.grantedNoticeIndefinite"),
    ).toBeTruthy();
  });

  it("有効な購入がボタンを止めている間は出さない", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mocks.fetchViewerPlan.mockResolvedValue({
      purchaseBlock: PASS_BLOCK,
      granted: { until: "2026-10-31T00:00:00.000Z" },
    });
    renderProvider();
    await waitFor(() => {
      expect(probeText()).toBe("until");
    });
    expect(screen.queryByText("offers.grantedNotice")).toBeNull();
  });

  it("付与の無い人には出さない", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    renderProvider();
    await waitFor(() => {
      expect(probeText()).toBe("none");
    });
    expect(screen.queryByText(/offers\.grantedNotice/)).toBeNull();
  });
});

/**
 * MarkAsReadButton の楽観的 UI / ロールバック挙動テスト
 *
 * @description
 * - 成功時: ラベルが切り替わる
 * - サーバーエラー時: ラベルが元に戻る（ロールバック）+ toast.error 発火
 * - 未認証時: /sign-in?redirect=... へ router.push
 * - 解除時: ConfirmationModal でキャンセル可能
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockMarkChapterRead, mockUnmarkChapterRead, mockPush, mockToastError } =
  vi.hoisted(() => ({
    mockMarkChapterRead: vi.fn(),
    mockUnmarkChapterRead: vi.fn(),
    mockPush: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock("../_actions/mark-chapter-read", () => ({
  markChapterRead: mockMarkChapterRead,
}));

vi.mock("../_actions/unmark-chapter-read", () => ({
  unmarkChapterRead: mockUnmarkChapterRead,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: mockToastError,
  },
}));

import { MarkAsReadButton } from "./mark-as-read-button";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * ConfirmationModal 内のボタンを label（i18n キー）で取得する。
 * useTranslations のモックが key をそのまま返すため、label = key でマッチできる。
 */
function getModalButton(
  container: HTMLElement,
  label: string,
): HTMLButtonElement | undefined {
  const buttons = Array.from(container.querySelectorAll("button"));
  return buttons.find((b) => b.textContent?.includes(label)) as
    | HTMLButtonElement
    | undefined;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MarkAsReadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initially renders markAsReadCta when initialRead=false", () => {
    const { getByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={false} />,
    );
    const btn = getByRole("button");
    expect(btn.textContent).toContain("markAsReadCta");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("initially renders unmarkAsReadCta when initialRead=true", () => {
    const { getAllByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={true} />,
    );
    // ConfirmationModal は未表示だが、念のため aria-pressed を持つトグルボタンを特定する
    const toggleBtn = getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") !== null,
    );
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn!.textContent).toContain("unmarkAsReadCta");
    expect(toggleBtn!.getAttribute("aria-pressed")).toBe("true");
  });

  it("optimistically switches to unmark label and keeps it on success", async () => {
    mockMarkChapterRead.mockResolvedValue({ ok: true });

    const { getByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={false} />,
    );
    const btn = getByRole("button");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(mockMarkChapterRead).toHaveBeenCalledWith("jantou-fu");
    expect(btn.textContent).toContain("unmarkAsReadCta");
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("rolls back the optimistic update when server returns a non-ok result (generic failure)", async () => {
    mockMarkChapterRead.mockResolvedValue({
      ok: false,
      skipped: "invalid-slug",
    });

    const { getByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={false} />,
    );
    const btn = getByRole("button");

    await act(async () => {
      fireEvent.click(btn);
    });

    // 楽観的更新が戻って初期ラベルに復帰
    expect(btn.textContent).toContain("markAsReadCta");
    expect(mockToastError).toHaveBeenCalledWith("updateFailedToast");
  });

  it("redirects to /sign-in?redirect=/learn/<slug> on anonymous result", async () => {
    mockMarkChapterRead.mockResolvedValue({
      ok: false,
      skipped: "anonymous",
    });

    const { getByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={false} />,
    );
    const btn = getByRole("button");

    await act(async () => {
      fireEvent.click(btn);
    });

    const expectedRedirect = encodeURIComponent("/learn/jantou-fu");
    expect(mockPush).toHaveBeenCalledWith(
      `/sign-in?redirect=${expectedRedirect}`,
    );
    expect(mockToastError).not.toHaveBeenCalled();
    // ロールバックもされていること
    expect(btn.textContent).toContain("markAsReadCta");
  });

  it("opens the confirmation modal before unmarking a read chapter", async () => {
    const { container, getAllByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={true} />,
    );
    const toggleBtn = getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") !== null,
    )!;

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // モーダルが開いており、確認テキストが表示されている
    expect(container.textContent).toContain("unmarkConfirmTitle");
    expect(container.textContent).toContain("unmarkConfirmMessage");
    // この時点ではまだサーバーは呼ばれない
    expect(mockUnmarkChapterRead).not.toHaveBeenCalled();
  });

  it("cancels unmarking when the user presses the cancel button", async () => {
    const { container, getAllByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={true} />,
    );
    const toggleBtn = getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") !== null,
    )!;

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    const cancelBtn = getModalButton(container, "unmarkConfirmCancel");
    expect(cancelBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(cancelBtn!);
    });

    expect(mockUnmarkChapterRead).not.toHaveBeenCalled();
    // トグルボタンのラベルは既読のまま
    expect(toggleBtn.textContent).toContain("unmarkAsReadCta");
    // モーダルは閉じている
    expect(container.textContent).not.toContain("unmarkConfirmTitle");
  });

  it("proceeds with unmark when the user confirms", async () => {
    mockUnmarkChapterRead.mockResolvedValue({ ok: true });

    const { container, getAllByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={true} />,
    );
    const toggleBtn = getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") !== null,
    )!;

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    const confirmBtn = getModalButton(container, "unmarkConfirmOk");
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(confirmBtn!);
    });

    expect(mockUnmarkChapterRead).toHaveBeenCalledWith("jantou-fu");
    expect(toggleBtn.textContent).toContain("markAsReadCta");
  });

  it("rolls back when unmarking fails after confirmation", async () => {
    mockUnmarkChapterRead.mockResolvedValue({
      ok: false,
      skipped: "invalid-slug",
    });

    const { container, getAllByRole } = render(
      <MarkAsReadButton slug="jantou-fu" initialRead={true} />,
    );
    const toggleBtn = getAllByRole("button").find(
      (b) => b.getAttribute("aria-pressed") !== null,
    )!;

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    const confirmBtn = getModalButton(container, "unmarkConfirmOk");
    await act(async () => {
      fireEvent.click(confirmBtn!);
    });

    // 一旦未読に切り替わったが、失敗でロールバック
    expect(toggleBtn.textContent).toContain("unmarkAsReadCta");
    expect(mockToastError).toHaveBeenCalledWith("updateFailedToast");
  });
});

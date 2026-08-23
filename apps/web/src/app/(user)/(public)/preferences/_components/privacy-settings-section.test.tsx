/**
 * PrivacySettingsSection のランキング非表示トグルの挙動テスト
 *
 * @description
 * - 読み込み中: スイッチを出さない（スケルトンのまま）
 * - ログイン済み: 保存済みの値をトグルの初期状態に反映する
 * - 未ログイン: 設定を取りに行かず既定値（オフ）を映す
 * - 保存失敗時: トグルを元に戻し toast.error を出す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockGetLeaderboardVisibility,
  mockSetLeaderboardVisibility,
  mockToastError,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockGetLeaderboardVisibility: vi.fn(),
  mockSetLeaderboardVisibility: vi.fn(),
  mockToastError: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock("../_actions/leaderboard-visibility", () => ({
  getLeaderboardVisibility: mockGetLeaderboardVisibility,
  setLeaderboardVisibility: mockSetLeaderboardVisibility,
}));

vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("react-hot-toast", () => ({ toast: { error: mockToastError } }));

import { PrivacySettingsSection } from "./privacy-settings-section";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signedIn() {
  mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
}

function signedOut() {
  mockUseAuth.mockReturnValue({ user: null, isLoading: false });
}

/** 値が確定してスイッチが描画されるまで待つ */
async function renderAndWaitForSwitch() {
  const { container } = render(<PrivacySettingsSection />);
  const checkbox = await waitFor(() => {
    const found = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(found).not.toBeNull();
    return found as HTMLInputElement;
  });
  return { container, checkbox };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PrivacySettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeaderboardVisibility.mockResolvedValue(false);
    mockSetLeaderboardVisibility.mockResolvedValue({ success: true });
  });

  it("does not render the switch while the auth state is still loading", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });

    const { container } = render(<PrivacySettingsSection />);

    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    expect(mockGetLeaderboardVisibility).not.toHaveBeenCalled();
  });

  it("reflects the stored value for a signed-in user", async () => {
    signedIn();
    mockGetLeaderboardVisibility.mockResolvedValue(true);

    const { checkbox } = await renderAndWaitForSwitch();

    expect(checkbox.checked).toBe(true);
  });

  it("shows the default without querying the server when signed out", async () => {
    signedOut();

    const { checkbox } = await renderAndWaitForSwitch();

    expect(checkbox.checked).toBe(false);
    expect(mockGetLeaderboardVisibility).not.toHaveBeenCalled();
  });

  it("persists the new value when toggled on", async () => {
    signedIn();
    const { checkbox } = await renderAndWaitForSwitch();

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(mockSetLeaderboardVisibility).toHaveBeenCalledWith(true);
    expect(checkbox.checked).toBe(true);
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("rolls back and notifies when saving fails", async () => {
    signedIn();
    mockSetLeaderboardVisibility.mockResolvedValue({ error: "updateFailed" });
    const { checkbox } = await renderAndWaitForSwitch();

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.checked).toBe(false);
    expect(mockToastError).toHaveBeenCalledTimes(1);
  });
});

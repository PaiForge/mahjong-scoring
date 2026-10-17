/**
 * DisplaySettingsSection の「手牌の上下をランダムにする」の行
 *
 * @description
 * - Pro（practice_tools あり）: スイッチを出し、保存値を切り替える
 * - Pro でない: スイッチの代わりに利用条件と料金ページへの導線を出し、保存値は消さない
 * - 特典の読み込み中: スイッチの位置にスケルトンを出す
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);

const { useAuth } = await import("@/test/auth-context-mock");
const { useDisplaySettingsStore } =
  await import("@/app/_hooks/use-display-settings-store");
const { DisplaySettingsSection } = await import("./display-settings-section");

function profileWith(benefits: readonly string[]) {
  return { benefits };
}

beforeEach(() => {
  act(() => useDisplaySettingsStore.getState().setTileOrientation("upright"));
});

describe("DisplaySettingsSection の手牌の向き", () => {
  it("Pro ならスイッチで保存値を切り替える", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([PlanBenefit.PracticeTools]),
      isProfileLoading: false,
    });
    render(<DisplaySettingsSection />);
    const toggle = screen.getByLabelText("tileOrientationTitle");
    fireEvent.click(toggle);
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");
  });

  it("Pro でなければ料金ページへの導線を出し、保存した random を消さない", () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    render(<DisplaySettingsSection />);
    expect(screen.queryByLabelText("tileOrientationTitle")).toBeNull();
    const link = screen.getByText("tileOrientationPro.link");
    expect(link.closest("a")?.getAttribute("href")).toBe("/plan");
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");
  });

  it("特典の読み込み中はスイッチを出さない", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: undefined,
      isProfileLoading: true,
    });
    render(<DisplaySettingsSection />);
    expect(screen.queryByLabelText("tileOrientationTitle")).toBeNull();
    expect(screen.queryByText("tileOrientationPro.link")).toBeNull();
    expect(screen.getByText("tileOrientationTitle")).toBeTruthy();
  });
});

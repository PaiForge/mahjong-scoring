/**
 * DisplaySettingsSection の Pro の行（「手牌の上下をランダムにする」「手牌を理牌せずに表示する」）
 *
 * @description
 * - Pro（practice_tools あり）: スイッチを出し、保存値を切り替える。2 行は独立
 * - Pro でない: スイッチの代わりに利用条件と料金ページへの導線を出し、保存値は消さない
 * - 特典の読み込み中: 押せないスイッチを出す
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

/** Pro の 2 行（保存値の項目・オンの値・見出しのキー） */
const ROWS = [
  {
    name: "手牌の向き",
    key: "tileOrientation",
    on: "random",
    title: "tileOrientationTitle",
  },
  {
    name: "手牌の並べ方",
    key: "tileOrder",
    on: "unsorted",
    title: "tileOrderTitle",
  },
] as const;

beforeEach(() => {
  act(() => {
    useDisplaySettingsStore.getState().setTileOrientation("upright");
    useDisplaySettingsStore.getState().setTileOrder("sorted");
  });
});

describe.each(ROWS)("DisplaySettingsSection の$name", ({ key, on, title }) => {
  it("Pro ならスイッチで保存値を切り替える", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([PlanBenefit.PracticeTools]),
      isProfileLoading: false,
    });
    render(<DisplaySettingsSection />);
    fireEvent.click(screen.getByLabelText(title));
    expect(useDisplaySettingsStore.getState()[key]).toBe(on);
  });

  it("Pro でなければ料金ページへの導線を出し、保存した希望を消さない", () => {
    act(() => {
      useDisplaySettingsStore.getState().setTileOrientation("random");
      useDisplaySettingsStore.getState().setTileOrder("unsorted");
    });
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    render(<DisplaySettingsSection />);
    expect(screen.queryByLabelText(title)).toBeNull();
    expect(screen.getByText(title)).toBeTruthy();
    const links = screen.getAllByText("practiceToolsPro.link");
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.closest("a")?.getAttribute("href")).toBe("/plan");
    }
    expect(useDisplaySettingsStore.getState()[key]).toBe(on);
  });

  it("特典の読み込み中は押せるスイッチも料金ページへの導線も出さない", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: undefined,
      isProfileLoading: true,
    });
    render(<DisplaySettingsSection />);
    expect(screen.queryByLabelText(title)).toBeNull();
    expect(screen.queryByText("practiceToolsPro.link")).toBeNull();
    expect(screen.getByText(title)).toBeTruthy();
  });
});

describe("DisplaySettingsSection の Pro の 2 行", () => {
  it("片方を切り替えても他方の保存値は変わらない", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([PlanBenefit.PracticeTools]),
      isProfileLoading: false,
    });
    render(<DisplaySettingsSection />);
    fireEvent.click(screen.getByLabelText("tileOrderTitle"));
    expect(useDisplaySettingsStore.getState()).toMatchObject({
      tileOrientation: "upright",
      tileOrder: "unsorted",
    });
    fireEvent.click(screen.getByLabelText("tileOrientationTitle"));
    fireEvent.click(screen.getByLabelText("tileOrderTitle"));
    expect(useDisplaySettingsStore.getState()).toMatchObject({
      tileOrientation: "random",
      tileOrder: "sorted",
    });
  });
});

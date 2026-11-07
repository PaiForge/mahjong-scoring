/**
 * PracticeSettingsSection（設定ページの「練習」の節）の Pro の行と答え方の行
 *
 * @description
 * Pro の行（「手牌の上下をランダムにする」「手牌を理牌せずに表示する」）
 * - Pro（practice_tools あり）: スイッチを出し、保存値を切り替える。2 行は独立
 * - Pro でない: スイッチの代わりに利用条件と料金ページへの導線を出し、保存値は消さない
 * - 特典の読み込み中: 押せないスイッチを出す
 *
 * 答え方の行
 * - 点数の入力方式: スイッチのオン / オフが select / タイルの保存値になる
 * - 子ツモの入力方式: 点数がタイルのままでも行を隠さない（リンクの着地先を残す）
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

vi.mock("next-intl", async () => ({
  ...(await import("@/test/intl-mock")),
  useLocale: () => "ja",
}));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);

const { useAuth } = await import("@/test/auth-context-mock");
const { useDisplaySettingsStore } =
  await import("@/app/_hooks/use-display-settings-store");
const { PracticeSettingsSection } = await import("./practice-settings-section");

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

describe.each(ROWS)("PracticeSettingsSection の$name", ({ key, on, title }) => {
  it("Pro ならスイッチで保存値を切り替える", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([PlanBenefit.PracticeTools]),
      isProfileLoading: false,
    });
    render(<PracticeSettingsSection />);
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
    render(<PracticeSettingsSection />);
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
    render(<PracticeSettingsSection />);
    expect(screen.queryByLabelText(title)).toBeNull();
    expect(screen.queryByText("practiceToolsPro.link")).toBeNull();
    expect(screen.getByText(title)).toBeTruthy();
  });
});

describe("PracticeSettingsSection の料金ページへの導線", () => {
  it("言語をまたぐ張り方を渡すと、日本語の料金ページへ hrefLang 付きで張り日本語のみの印を添える", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    render(
      <PracticeSettingsSection
        planLink={{
          navTarget: { href: "/plan", crossLocale: true },
          japaneseOnlyLabel: "language.japaneseOnly",
        }}
      />,
    );
    const links = screen.getAllByText("practiceToolsPro.link");
    expect(links).toHaveLength(2);
    for (const link of links) {
      const anchor = link.closest("a");
      expect(anchor?.getAttribute("href")).toBe("/plan");
      expect(anchor?.getAttribute("hrefLang")).toBe("ja");
    }
    expect(screen.getAllByText("language.japaneseOnly")).toHaveLength(2);
  });

  it("張り方を渡さなければ hrefLang も日本語のみの印も付けない（日本語のページの出力）", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    render(<PracticeSettingsSection />);
    for (const link of screen.getAllByText("practiceToolsPro.link")) {
      expect(link.closest("a")?.hasAttribute("hrefLang")).toBe(false);
    }
    expect(screen.queryByText("language.japaneseOnly")).toBeNull();
  });
});

describe("PracticeSettingsSection の Pro の 2 行", () => {
  it("片方を切り替えても他方の保存値は変わらない", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([PlanBenefit.PracticeTools]),
      isProfileLoading: false,
    });
    render(<PracticeSettingsSection />);
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

describe("PracticeSettingsSection の点数の入力方式", () => {
  it("スイッチをオンにすると select、オフに戻すとタイルを保存する", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    act(() => {
      useDisplaySettingsStore.getState().setScoreInput("tiles");
    });
    render(<PracticeSettingsSection />);
    const toggle = screen.getByLabelText("scoreInputTitle");
    expect(toggle).toHaveProperty("checked", false);

    fireEvent.click(toggle);
    expect(useDisplaySettingsStore.getState().scoreInput).toBe("select");

    fireEvent.click(toggle);
    expect(useDisplaySettingsStore.getState().scoreInput).toBe("tiles");
  });

  it("子ツモの入力方式の行は、タイルのままでも隠さない（リンクの着地先を残す）", () => {
    useAuth.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      profile: profileWith([]),
      isProfileLoading: false,
    });
    render(<PracticeSettingsSection />);
    expect(useDisplaySettingsStore.getState().scoreInput).toBe("tiles");
    expect(screen.getByLabelText("koTsumoInputTitle")).toBeTruthy();
    expect(document.getElementById("ko-tsumo-input")).not.toBeNull();
  });
});

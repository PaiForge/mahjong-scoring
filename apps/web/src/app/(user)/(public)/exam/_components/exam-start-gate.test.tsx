/**
 * ExamStartGate の出し分けテスト
 *
 * @description
 * - 未ログイン: アカウント登録の導線を出す（開始ボタンは出さない）
 * - 資格なし（未達成の上位級）: 道場への導線を出す（開始ボタンは出さない）
 * - 次に取る級 / 達成済みの級: 通常の開始ボタンを出す
 * - 段級位の取得失敗: 開始ボタンへ fail-open する（強制はサーバー側）
 *
 * どの受験できない状態でも、緑（primary）のボタンを開始ボタンの位置に
 * 置かないことまで見る。緑は「押して始める面」の色で、この位置の緑は
 * 試験開始と見分けが付かないため。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockUseAuth, mockFetchViewerRankSlugs } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFetchViewerRankSlugs: vi.fn(),
}));

vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("@/app/_lib/viewer-ranks", () => ({
  fetchViewerRankSlugs: mockFetchViewerRankSlugs,
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  // LinkButton の遷移待ちオーバーレイ（`LinkPendingOverlay`）が使う
  useLinkStatus: () => ({ pending: false }),
}));

import { ExamStartGate } from "./exam-start-gate";

const PLAY_HREF = "/exam/pinfu/play#practice";

/** 2級の試験（pinfu-exam）のゲートを描画する */
function renderGate() {
  return render(<ExamStartGate slug="pinfu-exam" playHref={PLAY_HREF} />);
}

/** 開始ボタン（play への遷移）が出ているか */
function startButton(): HTMLElement | null {
  return document.querySelector(`a[href="${PLAY_HREF}"]`);
}

/** 緑（primary）の塗りを持つ要素 */
function primaryFilledElements(): readonly Element[] {
  return [...document.querySelectorAll(".bg-primary-500")];
}

describe("ExamStartGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    mockFetchViewerRankSlugs.mockResolvedValue([]);
  });

  it("認証状態の解決中はスケルトンで場所を確保する", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: true });

    const { container } = renderGate();

    expect(startButton()).toBeNull();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  describe("未ログイン", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
    });

    it("アカウント登録の導線を出し、開始ボタンは出さない", async () => {
      renderGate();

      expect(await screen.findByText("examGate.signUpButton")).toBeTruthy();
      expect(document.querySelector('a[href="/sign-up"]')).not.toBeNull();
      expect(startButton()).toBeNull();
    });

    it("理由とログインの導線を添える", async () => {
      renderGate();

      expect(await screen.findByText(/examGate.signUpNote/)).toBeTruthy();
      expect(document.querySelector('a[href="/sign-in"]')).not.toBeNull();
    });

    it("登録ボタンを緑（試験開始の色）で塗らない", async () => {
      renderGate();

      await screen.findByText("examGate.signUpButton");
      expect(primaryFilledElements()).toHaveLength(0);
    });

    it("段級位を取りに行かない", () => {
      renderGate();

      expect(mockFetchViewerRankSlugs).not.toHaveBeenCalled();
    });
  });

  describe("受験資格なし（未達成の上位級の試験）", () => {
    beforeEach(() => {
      // 5級だけを持つユーザーが2級の試験ページを開いた場合
      mockFetchViewerRankSlugs.mockResolvedValue(["kyu-5"]);
    });

    it("道場への導線を出し、開始ボタンは出さない", async () => {
      renderGate();

      expect(await screen.findByText("examGate.dojoButton")).toBeTruthy();
      expect(document.querySelector('a[href="/dojo"]')).not.toBeNull();
      expect(startButton()).toBeNull();
    });

    it("道場ボタンを緑（試験開始の色）で塗らない", async () => {
      renderGate();

      await screen.findByText("examGate.dojoButton");
      expect(primaryFilledElements()).toHaveLength(0);
    });

    it("この試験の級（2級）ではなく先に取る級（4級）の帯色をまとわせる", async () => {
      renderGate();

      const button = await screen.findByText("examGate.dojoButton");
      const className = button.closest("a")?.className ?? "";
      // beltButtonVarsClass("kyu-4") が立てる変数（4級 = 青帯）
      expect(className).toContain("[--belt-fill:var(--color-blue-100)]");
      // 2級（緑帯）の色にはならない
      expect(className).not.toContain("green");
    });
  });

  it("次に取る級の試験なら開始ボタンを出す", async () => {
    // 3級まで持つユーザーにとって2級は次の級
    mockFetchViewerRankSlugs.mockResolvedValue(["kyu-5", "kyu-4", "kyu-3"]);

    renderGate();

    expect(await screen.findByText("startButton")).toBeTruthy();
    expect(startButton()).not.toBeNull();
  });

  it("達成済みの級の試験なら再挑戦として開始ボタンを出す", async () => {
    mockFetchViewerRankSlugs.mockResolvedValue([
      "kyu-5",
      "kyu-4",
      "kyu-3",
      "kyu-2",
    ]);

    renderGate();

    expect(await screen.findByText("startButton")).toBeTruthy();
  });

  it("段級位の取得に失敗したら開始ボタンへ fail-open する", async () => {
    mockFetchViewerRankSlugs.mockResolvedValue(undefined);

    renderGate();

    expect(await screen.findByText("startButton")).toBeTruthy();
  });
});

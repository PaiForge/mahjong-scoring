/**
 * NotificationBell のテスト
 *
 * @description
 * - 未ログイン / プロフィール未取得: 出さない
 * - 未読あり: 件数のバッジを出し、ラベルに件数を含める
 * - 100 件以上: 99+
 * - 既読イベント: プロフィールを取り直す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth as mockUseAuth } from "@/test/auth-context-mock";
import { act, render, screen } from "@testing-library/react";

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly "aria-label"?: string;
  }) => (
    <a href={href} aria-label={props["aria-label"]}>
      {children}
    </a>
  ),
}));

import {
  NOTIFICATIONS_READ_EVENT,
  dispatchNotificationsRead,
} from "@/lib/notifications/read-event";

import { NotificationBell } from "./notification-bell";

const refreshProfile = vi.fn(async () => undefined);

function authState(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: "user-1" },
    profile: { avatarUrl: null, name: "たろう", unreadNotificationCount: 0 },
    refreshProfile,
    ...overrides,
  });
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未ログインなら出さない", () => {
    authState({ user: null, profile: undefined });
    render(<NotificationBell />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("プロフィールが届くまでは出さない（アバターと同時に現れる）", () => {
    authState({ profile: undefined });
    render(<NotificationBell />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("未読が無くてもベルは出し、バッジは出さない", () => {
    authState();
    render(<NotificationBell />);
    const link = screen.getByRole("link", { name: "bell" });
    expect(link.getAttribute("href")).toBe("/mypage/notifications");
    expect(screen.queryByText("0")).toBeNull();
  });

  it("未読があれば件数を出す", () => {
    authState({
      profile: { avatarUrl: null, name: "たろう", unreadNotificationCount: 3 },
    });
    render(<NotificationBell />);
    expect(screen.getByRole("link", { name: "bellUnread" })).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("100 件以上は 99+ にまとめる", () => {
    authState({
      profile: {
        avatarUrl: null,
        name: "たろう",
        unreadNotificationCount: 120,
      },
    });
    render(<NotificationBell />);
    expect(screen.getByText("99+")).toBeDefined();
  });

  it("既読イベントでプロフィール（未読数）を取り直す", () => {
    authState();
    render(<NotificationBell />);
    expect(refreshProfile).not.toHaveBeenCalled();

    act(() => dispatchNotificationsRead());
    expect(refreshProfile).toHaveBeenCalledTimes(1);

    // イベント名が変わっていないことも確かめる（ページ側が同じ名前で投げる）
    act(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)));
    expect(refreshProfile).toHaveBeenCalledTimes(2);
  });
});

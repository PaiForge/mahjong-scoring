import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockMarkRead } = vi.hoisted(() => ({ mockMarkRead: vi.fn() }));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock("../../_actions/mark-read", () => ({
  markNotificationReadAction: mockMarkRead,
}));

import { NOTIFICATIONS_READ_EVENT } from "@/lib/notifications/read-event";
import type { NotificationListItem } from "@/lib/notifications/queries";

import { NotificationItem } from "../notification-item";

function item(
  overrides: Partial<NotificationListItem> = {},
): NotificationListItem {
  return {
    id: "n1",
    type: "purchase_completed",
    metadata: { kind: "lifetime" },
    readAt: undefined,
    createdAt: new Date("2026-10-01T03:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMarkRead.mockResolvedValue({ success: true });
});

describe("NotificationItem", () => {
  it("文面の辞書キーと日時を出し、プラン状況へのリンクになる", () => {
    render(
      <ul>
        <NotificationItem notification={item()} />
      </ul>,
    );

    expect(
      screen.getByText("messages.purchaseCompletedLifetime"),
    ).toBeDefined();
    expect(screen.getByText("2026/10/01 12:00")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/mypage/plan");
  });

  it("未読は点を出し、押すと既読にしてベルに知らせる", async () => {
    const listener = vi.fn();
    window.addEventListener(NOTIFICATIONS_READ_EVENT, listener);
    render(
      <ul>
        <NotificationItem notification={item()} />
      </ul>,
    );

    expect(screen.getByRole("img", { name: "unread" })).toBeDefined();
    fireEvent.click(screen.getByRole("link"));

    expect(mockMarkRead).toHaveBeenCalledWith("n1");
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    window.removeEventListener(NOTIFICATIONS_READ_EVENT, listener);
  });

  it("既読は点を出さず、押しても既読化を呼ばない", () => {
    render(
      <ul>
        <NotificationItem
          notification={item({ readAt: new Date("2026-10-02T00:00:00Z") })}
        />
      </ul>,
    );

    expect(screen.queryByRole("img", { name: "unread" })).toBeNull();
    fireEvent.click(screen.getByRole("link"));
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("登録に無い種別は汎用の文面で、押せない行として出す", () => {
    render(
      <ul>
        <NotificationItem notification={item({ type: "follow" })} />
      </ul>,
    );

    expect(screen.getByText("messages.unknown")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

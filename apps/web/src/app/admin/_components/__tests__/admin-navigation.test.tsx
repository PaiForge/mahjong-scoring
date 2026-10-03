import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminNavigation } from "../admin-navigation";

const route = vi.hoisted(() => ({ pathname: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const groups = [
  {
    label: "管理",
    items: [
      { href: "/admin", label: "ダッシュボード" },
      { href: "/admin/users", label: "ユーザー" },
      { href: "/admin/ads", label: "広告" },
    ],
  },
];

describe("管理ナビゲーションの現在地", () => {
  it.each([
    ["/admin", "ダッシュボード"],
    ["/admin/users", "ユーザー"],
    ["/admin/users/user-123", "ユーザー"],
    ["/admin/ads/new", "広告"],
    ["/admin/ads/creative-123/edit", "広告"],
    ["/admin/ads/links", "広告"],
  ])("%s では %s だけが選択される", (pathname, label) => {
    route.pathname = pathname;
    render(<AdminNavigation groups={groups} label="管理画面" />);
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
    expect(screen.getByRole("link", { current: "page" }).textContent).toBe(
      label,
    );
  });

  it("セグメント名が前方一致するだけの URL を選択しない", () => {
    route.pathname = "/admin/users-export";
    render(<AdminNavigation groups={groups} label="管理画面" />);
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
});

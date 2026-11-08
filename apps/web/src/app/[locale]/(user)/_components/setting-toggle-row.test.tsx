/**
 * SettingLockedRow（利用条件を満たすまで切り替えられない設定行）の導線
 *
 * @description
 * - `href` で渡すと同じ言語の中のリンク（`next/link`）を出す（従来の形）
 * - `navTarget` で渡し、言語をまたがないときは `href` と同じ出力になる
 * - `navTarget` が言語をまたぐときは素の `<a hrefLang="ja">` にし、「日本語のみ」の印を添える
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => await import("@/test/next-link-mock"));

const { SettingLockedRow } = await import("./setting-toggle-row");

const BASE = {
  id: "tile-order",
  title: "手牌の並べ方",
  badge: "Pro",
  note: "Pro プランで利用できます",
} as const;

describe("SettingLockedRow の導線", () => {
  it("href で渡すと同じ言語の中のリンクを出し、日本語のみの印を添えない", () => {
    render(
      <SettingLockedRow
        {...BASE}
        link={{ href: "/plan", label: "プランを見る" }}
      />,
    );
    const link = screen.getByText("プランを見る").closest("a");
    expect(link?.getAttribute("href")).toBe("/plan");
    expect(link?.hasAttribute("hrefLang")).toBe(false);
    expect(screen.queryByText("日本語のみ")).toBeNull();
  });

  it("言語をまたがない navTarget は href で渡したときと同じ DOM になる", () => {
    const { container: byHref } = render(
      <SettingLockedRow
        {...BASE}
        link={{ href: "/plan", label: "プランを見る" }}
      />,
    );
    const { container: byTarget } = render(
      <SettingLockedRow
        {...BASE}
        link={{
          navTarget: { href: "/plan", crossLocale: false },
          japaneseOnlyLabel: "日本語のみ",
          label: "プランを見る",
        }}
      />,
    );
    expect(byTarget.innerHTML).toBe(byHref.innerHTML);
  });

  it("言語をまたぐ navTarget は hrefLang 付きの素のリンクにして日本語のみの印を添える", () => {
    render(
      <SettingLockedRow
        {...BASE}
        link={{
          navTarget: { href: "/plan", crossLocale: true },
          japaneseOnlyLabel: "Japanese only",
          label: "See plans",
        }}
      />,
    );
    const link = screen.getByText("See plans").closest("a");
    expect(link?.getAttribute("href")).toBe("/plan");
    expect(link?.getAttribute("hrefLang")).toBe("ja");
    expect(screen.getByText("Japanese only")).toBeTruthy();
  });
});

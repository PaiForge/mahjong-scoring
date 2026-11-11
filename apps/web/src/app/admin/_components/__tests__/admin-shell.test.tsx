import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "../admin-shell";

const labels = { openMenu: "メニューを開く", closeMenu: "メニューを閉じる" };

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderShell() {
  render(
    <AdminShell
      labels={labels}
      sidebar={<a href="#users">ユーザー</a>}
      topbarStart={<span>運営</span>}
      topbarEnd={<span>サイト</span>}
    >
      <main>本文</main>
    </AdminShell>,
  );
  const sidebar = document.getElementById("admin-sidebar");
  if (!sidebar) throw new Error("sidebar not rendered");
  return {
    sidebar,
    menuButton: screen.getByRole("button", { name: labels.openMenu }),
  };
}

describe("AdminShell のドロワー", () => {
  it("メニューボタンで開き、閉じるボタンへフォーカスを移して背景のスクロールを止める", () => {
    const { sidebar, menuButton } = renderShell();
    expect(sidebar.hasAttribute("data-open")).toBe(false);
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(menuButton);

    expect(sidebar.hasAttribute("data-open")).toBe(true);
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: labels.closeMenu }),
    );
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("Escape で閉じてメニューボタンへフォーカスを戻し、スクロール止めを外す", () => {
    const { sidebar, menuButton } = renderShell();
    fireEvent.click(menuButton);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(sidebar.hasAttribute("data-open")).toBe(false);
    expect(document.activeElement).toBe(menuButton);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("ナビのリンクを押すと閉じる", () => {
    const { sidebar, menuButton } = renderShell();
    fireEvent.click(menuButton);

    fireEvent.click(screen.getByRole("link", { name: "ユーザー" }));

    expect(sidebar.hasAttribute("data-open")).toBe(false);
  });
});

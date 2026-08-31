import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MobileTabBar } from "./mobile-tab-bar";

const mockPathname = vi.hoisted(() => vi.fn<() => string>());

vi.mock("next/navigation", () => ({
  usePathname: mockPathname,
}));

function renderAt(pathname: string) {
  mockPathname.mockReturnValue(pathname);
  render(
    <NextIntlClientProvider
      locale="ja"
      messages={{
        nav: {
          practice: "練習",
          learn: "教本",
          scoreTable: "点数表",
          leaderboard: "ランキング",
          mypage: "マイページ",
        },
      }}
    >
      <MobileTabBar />
    </NextIntlClientProvider>,
  );
}

describe("MobileTabBar", () => {
  it("通常のページでは描画する", () => {
    renderAt("/practice");

    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("練習のプレイ中は描画しない", () => {
    renderAt("/practice/jantou-fu/play");

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("トレーニング中は描画しない", () => {
    renderAt("/practice/jantou-fu/training");

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("試験のプレイ中は描画しない", () => {
    renderAt("/exam/fu/play");

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("結果ページでは描画する", () => {
    renderAt("/practice/jantou-fu/result");

    expect(screen.getByRole("navigation")).toBeDefined();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useBodyScrollLock } from "@/app/_hooks/use-body-scroll-lock";
import { MobileTabBar } from "./mobile-tab-bar";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

import { setPathname } from "@/test/navigation-mock";

/** 画面を覆う UI が開いている状態を作る（モーダル・ドロワーと同じ経路で） */
function OpenOverlay() {
  useBodyScrollLock(true);
  return null;
}

function renderAt(pathname: string, overlay = false) {
  setPathname(pathname);
  render(
    <NextIntlClientProvider
      locale="ja"
      messages={{
        nav: {
          home: "ホーム",
          dojo: "道場",
          practice: "練習",
          learn: "教本",
          scoreTable: "点数表",
          leaderboard: "ランキング",
          mypage: "マイページ",
        },
      }}
    >
      <MobileTabBar />
      {overlay && <OpenOverlay />}
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

  it("オーバーレイが開いている間は引っ込める", () => {
    renderAt("/practice", true);

    // 半透明のオーバーレイの下に不透明なタブバーが残ると透けて見えるため、
    // md 未満でも出さない（md 以上は元から md:hidden で消えている）。
    expect(screen.getByRole("navigation").className).toContain("hidden");
    expect(screen.getByRole("navigation").className).not.toContain("md:hidden");
  });

  it("結果ページでは描画する", () => {
    renderAt("/practice/jantou-fu/result");

    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("ホームを先頭に道場を含み、ランキングは含めない", () => {
    renderAt("/practice");

    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(labels).toEqual(["ホーム", "道場", "練習", "教本", "点数表"]);
  });

  it("配下のページでも親のタブを選択中にする", () => {
    renderAt("/dojo/ranks/kyu5");

    expect(screen.getByRole("link", { name: /道場/ }).className).toContain(
      "text-primary",
    );
    expect(
      screen.getByRole("link", { name: /ホーム/ }).className,
    ).not.toContain("text-primary");
  });
});

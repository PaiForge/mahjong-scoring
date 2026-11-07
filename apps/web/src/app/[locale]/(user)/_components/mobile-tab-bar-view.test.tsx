import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useBodyScrollLock } from "@/app/_hooks/use-body-scroll-lock";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { MobileTabBarView } from "./mobile-tab-bar-view";
import { LOCALE_LINK_TABLE } from "./_lib/locale-link-table";
import type { LocaleLinkTable } from "./_lib/locale-links";

// 公開 href の表（locale-link-table）が読む next-intl のナビゲーションは、
// モジュールの評価時に redirect / permanentRedirect を束ねる
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

import { setPathname } from "@/test/navigation-mock";

/** 画面を覆う UI が開いている状態を作る（モーダル・ドロワーと同じ経路で） */
function OpenOverlay() {
  useBodyScrollLock(true);
  return null;
}

function renderAt(
  pathname: string,
  overlay = false,
  locale: SupportedLocale = "ja",
  table: LocaleLinkTable = LOCALE_LINK_TABLE,
) {
  setPathname(pathname);
  render(
    <NextIntlClientProvider
      locale={locale}
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
      <MobileTabBarView localeLinks={{ locale, table }} />
      {overlay && <OpenOverlay />}
    </NextIntlClientProvider>,
  );
}

describe("MobileTabBarView", () => {
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

    // 選択中は墨（text-foreground）、それ以外は muted。hover: 付きの同名クラスと
    // 取り違えないよう、クラスを 1 語ずつに分けて見る
    expect(
      screen.getByRole("link", { name: /道場/ }).className.split(" "),
    ).toContain("text-foreground");
    expect(
      screen.getByRole("link", { name: /ホーム/ }).className.split(" "),
    ).not.toContain("text-foreground");
  });

  it("日本語のページでは今までどおりの href を張る", () => {
    renderAt("/practice");

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/",
      "/dojo",
      "/practice",
      "/lessons",
      "/reference/score-table",
    ]);
  });

  it("英語のページでは接頭辞を外して選択中とセッション中を判定する", () => {
    renderAt("/en/practice/jantou-fu/play", false, "en");

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("英語のページでは英語版の無いタブを出さず、英語で公開しているタブだけを /en の href で出す", () => {
    renderAt("/en/reference/score-table", false, "en");

    // 英語で公開しているのはホーム・レッスン・点数表。道場・練習は英語で未公開なので、
    // 英語の名前のまま日本語のページへ飛ばすタブも、/en を付けた存在しない URL も出さない
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(["/en", "/en/lessons", "/en/reference/score-table"]);
    expect(
      screen.getByRole("link", { name: /点数表/ }).className.split(" "),
    ).toContain("text-foreground");
  });

  it("英語で公開しているタブが 1 つだけならバーごと出さない", () => {
    // 英語で公開しているのが点数表だけの表（タブ 1 つのバーは行き来の役に立たない）
    renderAt("/en/reference/score-table", false, "en", {
      "/reference/score-table": {
        ja: "/reference/score-table",
        en: "/en/reference/score-table",
      },
    });

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("英語で公開したタブが増えれば /en の href で出し、接頭辞を外して選択中を判定する", () => {
    // 将来、練習一覧も英語で公開したときの表
    renderAt("/en/practice/jantou-fu", false, "en", {
      ...LOCALE_LINK_TABLE,
      "/practice": { ja: "/practice", en: "/en/practice" },
    });

    const practice = screen.getByRole("link", { name: /練習/ });
    expect(practice.getAttribute("href")).toBe("/en/practice");
    expect(practice.className.split(" ")).toContain("text-foreground");
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/en",
      "/en/practice",
      "/en/lessons",
      "/en/reference/score-table",
    ]);
  });
});

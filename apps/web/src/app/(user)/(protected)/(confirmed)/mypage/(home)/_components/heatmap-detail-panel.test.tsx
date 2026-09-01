import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/ja.json";

import { HeatmapDetailPanel } from "./heatmap-detail-panel";

/**
 * 実際の辞書（ja.json）で描画する。`practice.practices.<key>` は
 * `title` / `shortTitle` / `description` を持つオブジェクトで、末端まで
 * 指定しないと next-intl が訳文ではなくキーのパスを描画する。テスト用の
 * 平坦なメッセージを渡すとその失敗が再現しないため、本物の辞書を使う。
 */
function renderPanel(props: {
  selectedDate?: string;
  selectedTotal?: number;
  moduleBreakdown?: Record<string, number>;
}) {
  render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      <HeatmapDetailPanel
        selectedDate={props.selectedDate}
        selectedTotal={props.selectedTotal ?? 0}
        moduleBreakdown={props.moduleBreakdown}
      />
    </NextIntlClientProvider>,
  );
}

describe("HeatmapDetailPanel", () => {
  it("練習種別を日本語の練習名で表示する", () => {
    renderPanel({
      selectedDate: "2026-08-31",
      selectedTotal: 30,
      moduleBreakdown: { jantou_fu: 20, machi_fu: 10 },
    });

    expect(screen.getByText("雀頭の符")).toBeDefined();
    expect(screen.getByText("待ちの符")).toBeDefined();
  });

  it("i18n のキーのパスを露出しない", () => {
    renderPanel({
      selectedDate: "2026-08-31",
      selectedTotal: 20,
      moduleBreakdown: { jantou_fu: 20 },
    });

    expect(screen.queryByText(/practice\.practices\./)).toBeNull();
  });

  it("辞書に無い練習種別は可視マーカー付きで描画し警告する", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderPanel({
      selectedDate: "2026-08-31",
      selectedTotal: 5,
      moduleBreakdown: { not_a_menu: 5 },
    });

    expect(screen.getByText("[?] not_a_menu")).toBeDefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("日付未選択ならプレースホルダを表示する", () => {
    renderPanel({});

    expect(
      screen.getByText(messages.mypage.heatmap.detailPanelPlaceholder),
    ).toBeDefined();
  });
});

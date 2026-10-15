import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/test/intl-render";

import { messages } from "@mahjong-scoring/messages/ja";

import { HeatmapDetailPanel } from "./heatmap-detail-panel";

/**
 * 実際の辞書（日本語の辞書）で描画する。`practice.practices.<key>` は
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
    <HeatmapDetailPanel
      selectedDate={props.selectedDate}
      selectedTotal={props.selectedTotal ?? 0}
      moduleBreakdown={props.moduleBreakdown}
    />,
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

  it("レジストリに無い種別は「その他」に合算して末尾に出し、キーを露出しない", () => {
    renderPanel({
      selectedDate: "2026-08-31",
      selectedTotal: 38,
      moduleBreakdown: { jantou_fu: 30, not_a_menu: 5, unknown: 3 },
    });

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "雀頭の符30 経験値",
      `${messages.mypage.heatmap.otherMenuTypes}8 経験値`,
    ]);
    expect(screen.queryByText(/not_a_menu|unknown/)).toBeNull();
  });

  it("日付未選択ならプレースホルダを表示する", () => {
    renderPanel({});

    expect(
      screen.getByText(messages.mypage.heatmap.detailPanelPlaceholder),
    ).toBeDefined();
  });
});

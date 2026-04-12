"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import type { ExpHeatmapData } from "@/lib/db/get-exp-heatmap-data";
import type { PracticeMenuMessageKey } from "@/lib/db/practice-menu-types";
import { isPracticeMenuType, menuTypeToMessageKey } from "@/lib/db/practice-menu-types";

import type { HeatmapLayout } from "../_lib/heatmap-utils";
import { getExpLevel } from "../_lib/heatmap-utils";

/**
 * 各強度レベル (0–4) の Tailwind クラス。
 *
 * Level 0 は活動なしの淡色、Level 1–4 は primary カラースケールで濃淡を表現する。
 * 本プロジェクトは `bg-muted`/`bg-primary` トークンを持たないため `surface-*`/`primary-*` を使う。
 */
const LEVEL_CLASSES: Record<number, string> = {
  0: "bg-surface-200",
  1: "bg-primary-200",
  2: "bg-primary-400",
  3: "bg-primary-600",
  4: "bg-primary-700",
};

const BAR_CHART_HEIGHT_PX = 140;
const BAR_CHART_MIN_HEIGHT_PX = 4;


interface Props {
  data: ExpHeatmapData;
  layout: HeatmapLayout;
}

export function ExpActivityHeatmap({ data, layout }: Props) {
  const t = useTranslations("mypage.heatmap");
  const tMenu = useTranslations("mypage.challenges.menuTypes");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dayLabels: Partial<Record<number, string>> = {
    1: t("dayLabels.mon"),
    3: t("dayLabels.wed"),
    5: t("dayLabels.fri"),
  };

  const handleCellClick = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  // 空状態判定: 0 のエントリしか無いケースも空として扱う。
  const hasAnyActivity = Object.values(data.daily).some((v) => v > 0);

  const moduleBreakdown = selectedDate ? (data.dailyByModule[selectedDate] ?? null) : null;
  const selectedTotal = selectedDate ? (data.daily[selectedDate] ?? 0) : 0;

  const expSuffix = t("expSuffix");

  function getCellAriaLabel(dateStr: string, amount: number): string {
    return t("cellAriaLabel", { date: dateStr, amount });
  }

  /**
   * menuType キーをラベル文字列に解決する。
   *
   * - 既知キー (`PracticeMenuType`) は i18n から取得（snake_case → camelCase 変換）
   * - `'unknown'` は専用ラベル `noActivity` のコンテキスト外で出ないので `?` 表示
   * - それ以外（= MODULE_WEIGHT に追加されたが i18n 未登録のキー）は
   *   `console.warn` で開発者に通知しつつ `[?] key` と可視マーカーで描画する
   */
  function getMenuTypeLabel(moduleKey: string): string {
    if (isPracticeMenuType(moduleKey)) {
      return tMenu(menuTypeToMessageKey(moduleKey) as PracticeMenuMessageKey);
    }
    if (moduleKey === "unknown") {
      return `[?] ${moduleKey}`;
    }
    if (typeof console !== "undefined") {
      console.warn("[mypageHeatmap] missing i18n for menuType:", moduleKey);
    }
    return `[?] ${moduleKey}`;
  }

  function renderDesktopGrid() {
    return (
      <div
        className="inline-grid"
        style={{ gridTemplateColumns: "auto 1fr" }}
        role="grid"
        aria-label={t("gridAriaLabel")}
      >
        <div />
        <div className="flex gap-[3px]">
          {layout.weeks.map((_, weekIdx) => {
            const monthLabel = layout.monthLabels.find((m) => m.weekIdx === weekIdx);
            return (
              <div
                key={weekIdx}
                className="size-3 text-xs text-surface-500 leading-none"
                aria-hidden="true"
              >
                {monthLabel ? monthLabel.label : ""}
              </div>
            );
          })}
        </div>

        {Array.from({ length: 7 }, (_, dayIdx) => (
          <div key={dayIdx} className="contents">
            <div
              className="flex h-3 items-center pr-1.5 text-xs text-surface-500 leading-none"
              aria-hidden="true"
            >
              {dayLabels[dayIdx] ?? ""}
            </div>
            <div className="flex gap-[3px]" role="row">
              {layout.weeks.map((week, weekIdx) => {
                const dateStr = week[dayIdx] ?? null;
                if (dateStr === null) {
                  return (
                    <div
                      key={`empty-${weekIdx}`}
                      className="size-3 rounded-sm"
                      aria-hidden="true"
                    />
                  );
                }

                const amount = data.daily[dateStr] ?? 0;
                const level = getExpLevel(amount, layout.maxAmount);
                const levelClass = LEVEL_CLASSES[level] ?? LEVEL_CLASSES[0];
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    role="gridcell"
                    aria-label={getCellAriaLabel(dateStr, amount)}
                    aria-selected={isSelected}
                    className={`size-3 rounded-sm ${levelClass} ${
                      isSelected ? "ring-2 ring-surface-900" : ""
                    } cursor-pointer`}
                    onClick={() => handleCellClick(dateStr)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderBarChart() {
    const maxAmount = Math.max(0, ...layout.recentDays.map((d) => data.daily[d] ?? 0));

    return (
      <div
        className="flex items-end gap-2"
        style={{ height: `${BAR_CHART_HEIGHT_PX}px` }}
        role="group"
        aria-label={t("barChartAriaLabel")}
      >
        {layout.recentDays.map((dateStr) => {
          const amount = data.daily[dateStr] ?? 0;
          const ratio = maxAmount > 0 ? amount / maxAmount : 0;
          const barHeight =
            amount > 0
              ? Math.max(
                  BAR_CHART_MIN_HEIGHT_PX,
                  Math.round(ratio * (BAR_CHART_HEIGHT_PX - 24)),
                )
              : BAR_CHART_MIN_HEIGHT_PX;
          const isSelected = dateStr === selectedDate;
          const dateLabel = formatBarLabel(dateStr);

          return (
            <div key={dateStr} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-surface-500">{amount}</span>
              <button
                type="button"
                aria-label={getCellAriaLabel(dateStr, amount)}
                aria-selected={isSelected}
                className={`w-full rounded-t bg-primary-600 cursor-pointer ${
                  isSelected ? "ring-2 ring-surface-900" : ""
                }`}
                style={{ height: `${barHeight}px` }}
                onClick={() => handleCellClick(dateStr)}
              />
              <span className="text-xs text-surface-500">{dateLabel}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* デスクトップ: 46 週ヒートマップ */}
      <div className="hidden overflow-x-auto md:flex md:justify-center">{renderDesktopGrid()}</div>
      {/* モバイル: 直近 7 日間のバーチャート */}
      <div className="block md:hidden">{renderBarChart()}</div>

      {/* 空状態メッセージ */}
      {!hasAnyActivity && <p className="text-sm text-surface-500">{t("empty")}</p>}

      {/* レジェンド — デスクトップのみ */}
      <div
        className="hidden items-center justify-end text-xs text-surface-500 md:flex"
        aria-label={t("legendAriaLabel")}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span>{t("less")}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`size-3 rounded-sm ${LEVEL_CLASSES[level]}`} />
          ))}
          <span>{t("more")}</span>
        </div>
      </div>

      {/* 選択日の詳細パネル（常にマウントし aria-live で読み上げ） */}
      <div
        className="rounded-lg border border-surface-200 bg-surface-50 p-4 text-sm"
        role="status"
        aria-live="polite"
      >
        {selectedDate ? (
          <>
            <p className="font-semibold text-surface-900">
              {new Date(selectedDate + "T00:00:00+09:00").toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Tokyo",
              })}
            </p>
            <p className="mt-1 text-surface-600">
              {t("total")}: {selectedTotal} {expSuffix}
            </p>
            {moduleBreakdown && Object.keys(moduleBreakdown).length > 0 ? (
              <ul className="mt-2 space-y-1">
                {Object.entries(moduleBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([moduleKey, exp]) => (
                    <li key={moduleKey} className="flex justify-between text-surface-600">
                      <span>{getMenuTypeLabel(moduleKey)}</span>
                      <span>
                        {exp} {expSuffix}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-2 text-surface-500">{t("noActivity")}</p>
            )}
          </>
        ) : (
          <p className="text-surface-500">{t("detailPanelPlaceholder")}</p>
        )}
      </div>
    </div>
  );
}

/**
 * 'YYYY-MM-DD' を 'M/D' 形式に変換する（ロケール非依存）。
 */
function formatBarLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

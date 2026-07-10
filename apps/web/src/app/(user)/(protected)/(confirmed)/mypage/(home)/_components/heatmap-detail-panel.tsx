"use client";

import { useTranslations } from "next-intl";

import {
  isPracticeMenuType,
  menuTypeToMessageKey,
} from "@/lib/db/practice-menu-types";

interface HeatmapDetailPanelProps {
  readonly selectedDate: string | undefined;
  /** 選択日の合計 EXP */
  readonly selectedTotal: number;
  /** 選択日の練習種別ごとの EXP 内訳（未選択時は undefined） */
  readonly moduleBreakdown: Readonly<Record<string, number>> | undefined;
}

/**
 * 選択日の EXP 詳細パネル（常にマウントし aria-live で読み上げ）
 * ヒートマップ詳細パネル
 */
export function HeatmapDetailPanel({
  selectedDate,
  selectedTotal,
  moduleBreakdown,
}: HeatmapDetailPanelProps) {
  const t = useTranslations("mypage.heatmap");
  const tMenu = useTranslations("mypage.challenges.menuTypes");
  const expSuffix = t("expSuffix");

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
      return tMenu(menuTypeToMessageKey(moduleKey));
    }
    if (moduleKey === "unknown") {
      return `[?] ${moduleKey}`;
    }
    if (typeof console !== "undefined") {
      console.warn("[mypageHeatmap] missing i18n for menuType:", moduleKey);
    }
    return `[?] ${moduleKey}`;
  }

  return (
    <div
      className="rounded-lg border border-surface-200 bg-surface-50 p-4 text-sm"
      role="status"
      aria-live="polite"
    >
      {selectedDate ? (
        <>
          <p className="font-semibold text-surface-900">
            {new Date(selectedDate + "T00:00:00+09:00").toLocaleDateString(
              "ja-JP",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Tokyo",
              },
            )}
          </p>
          <p className="mt-1 text-surface-600">
            {t("total")}: {selectedTotal} {expSuffix}
          </p>
          {moduleBreakdown && Object.keys(moduleBreakdown).length > 0 ? (
            <ul className="mt-2 space-y-1">
              {Object.entries(moduleBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([moduleKey, exp]) => (
                  <li
                    key={moduleKey}
                    className="flex justify-between text-surface-600"
                  >
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
  );
}

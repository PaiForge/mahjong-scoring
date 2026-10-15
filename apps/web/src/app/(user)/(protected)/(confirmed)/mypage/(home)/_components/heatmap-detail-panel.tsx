"use client";

import { useTranslations } from "next-intl";

import { menuTypeToMessageKey } from "@mahjong-scoring/features/practice-menu-types";
import { formatJstDayKeyLong } from "@mahjong-scoring/features/jst";
import { buildExpBreakdown } from "@mahjong-scoring/features/mypage/exp-breakdown";

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
  const tMenu = useTranslations("practice.practices");
  const expSuffix = t("expSuffix");

  // 練習名の辞書は `practice.practices.<key>` が `title` / `shortTitle` /
  // `description` を持つオブジェクトなので、末端の `shortTitle` まで指定する。
  // オブジェクトを指すと next-intl は訳文ではなくキーのパスを描画する
  const breakdown = moduleBreakdown
    ? buildExpBreakdown(moduleBreakdown)
    : undefined;
  const lines = breakdown
    ? [
        ...breakdown.rows.map(({ menuType, exp }) => ({
          key: menuType,
          label: tMenu(`${menuTypeToMessageKey(menuType)}.shortTitle`),
          exp,
        })),
        ...(breakdown.otherExp > 0
          ? [
              {
                key: "other",
                label: t("otherMenuTypes"),
                exp: breakdown.otherExp,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div
      className="rounded-panel border border-panel bg-surface-50 p-4 text-sm"
      role="status"
      aria-live="polite"
    >
      {selectedDate ? (
        <>
          <p className="font-semibold text-surface-900">
            {formatJstDayKeyLong(selectedDate)}
          </p>
          <p className="mt-1 text-surface-600">
            {t("total")}: {selectedTotal} {expSuffix}
          </p>
          {lines.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {lines.map(({ key, label, exp }) => (
                <li key={key} className="flex justify-between text-surface-600">
                  <span>{label}</span>
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

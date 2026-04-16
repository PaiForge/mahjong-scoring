"use client";

import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

interface YakuListDisplayProps {
  readonly yakuDetails: readonly YakuDetail[];
}

/**
 * 役一覧と翻数を表示するコンポーネント
 * 役一覧表示
 */
export function YakuListDisplay({ yakuDetails }: YakuListDisplayProps) {
  const t = useTranslations("manganScoreCalculationChallenge");

  const totalHan = yakuDetails.reduce((sum, yaku) => sum + yaku.han, 0);

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
      <div className="mb-2 text-xs font-bold text-amber-800">{t("yakuListTitle")}</div>
      <ul className="space-y-1">
        {yakuDetails.map((yaku, index) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-surface-800">{yaku.name}</span>
            <span className="text-amber-700 font-medium">{t("yakuHanSuffix", { count: yaku.han })}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 border-t border-amber-200 pt-2 flex items-center justify-between text-sm font-bold">
        <span className="text-amber-900">{t("yakuTotalHan", { count: totalHan })}</span>
      </div>
    </div>
  );
}

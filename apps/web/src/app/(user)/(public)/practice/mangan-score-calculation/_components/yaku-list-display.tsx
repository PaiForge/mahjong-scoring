"use client";

import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

interface YakuListDisplayProps {
  readonly yakuDetails: readonly YakuDetail[];
}

/**
 * 役一覧と翻数を表示するコンポーネント
 * 役一覧表示
 *
 * この練習は役と翻数を与えたうえで点数だけを答えさせるので、この一覧は
 * 答え合わせではなく出題の一部（与件）。手牌の盤面と設問の間に置く。
 *
 * 琥珀は使わない。このアプリで琥珀が意味するのは教本のコラム
 * （{@link import("@/app/(user)/_components/highlight-panel").HighlightPanel}）と
 * 表の注目セル（{@link import("@/app/(user)/_components/_lib/table-highlight")}）、
 * つまり「地の文から浮かせて読ませる」合図で、常に出ている与件には合わない
 * （`globals.css` の状態色の項も、意味を持つ色に Tailwind 既定の amber-* を
 * 直接書くことを禁じている）。表示だけの面の既定どおり、太枠と淡い地で
 * 区切る（影は押せる面の記号なので付けない）。
 *
 * 高さは出題待ちのプレースホルダと `loading.tsx` が先に場所を確保している
 * （{@link import("../../_lib/board-area-height").BOARD_AREA_HEIGHT} の
 * `manganScoreCalculation`）。余白・文字サイズ・枠の太さを変えるとその実測値が
 * ずれて盤面が現れた瞬間に画面が跳ねるため、変えるときは測り直すこと。
 */
export function YakuListDisplay({ yakuDetails }: YakuListDisplayProps) {
  const t = useTranslations("manganScoreCalculationChallenge");

  const totalHan = yakuDetails.reduce((sum, yaku) => sum + yaku.han, 0);

  return (
    <div className="space-y-2 rounded-lg bg-surface-50 border-3 border-ink p-3">
      <div className="text-xs font-bold text-surface-900">
        {t("yakuListTitle")}
      </div>
      <ul className="space-y-1">
        {yakuDetails.map((yaku, index) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-surface-800">{yaku.name}</span>
            <span className="text-surface-600 font-medium">
              {t("yakuHanSuffix", { count: yaku.han })}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t-2 border-ink pt-2 flex items-center justify-between text-sm font-bold">
        <span className="text-surface-900">
          {t("yakuTotalHan", { count: totalHan })}
        </span>
      </div>
    </div>
  );
}

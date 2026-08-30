"use client";

import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { orderYakuDetails } from "../../_lib/order-yaku-details";

interface HanBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
}

/**
 * 翻数の内訳表示
 * 翻内訳表示
 *
 * 回答後のフィードバックとして、成立していた役とその翻数、合計を示す。
 * 「何翻だったか」だけでは翻数の数え間違いを直せない — どの役を見落とし、
 * どの役を数えすぎたのかは内訳を並べて初めて分かる。
 *
 * 並びはライブラリが役を判定した順ではなく、役選択練習の選択肢と同じ順
 * （{@link orderYakuDetails}）。問題ごとに立直の現れる位置が変わると、
 * 結果を続けて読むときに目が迷う。
 *
 * 合計が正解と一致しない場合（例: 16翻 → 役満）は丸めの行を出す。
 */
export function HanBreakdown({ yakuDetails, correctHan }: HanBreakdownProps) {
  const t = useTranslations("hanCountChallenge");
  const yakuOrder = useYakuOrder();

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const rawTotal = ordered.reduce((sum, detail) => sum + detail.han, 0);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-surface-500">
        {t("breakdownTitle")}
      </p>

      <DataTable
        header={
          <>
            <DataTableHeaderCell align="left">
              {t("breakdownColYaku")}
            </DataTableHeaderCell>
            <DataTableHeaderCell align="right">
              {t("breakdownColHan")}
            </DataTableHeaderCell>
          </>
        }
      >
        {ordered.map((detail, i) => (
          <tr key={i} className="bg-white">
            <DataTableRowHeaderCell>{detail.name}</DataTableRowHeaderCell>
            <td className="px-4 py-3 text-right text-surface-800">
              {t("hanOption", { count: detail.han })}
            </td>
          </tr>
        ))}
        <tr className="bg-primary-50">
          <td className="px-4 py-3 text-left font-bold whitespace-nowrap text-surface-900">
            {t("breakdownTotal")}
          </td>
          <td className="px-4 py-3 text-right font-bold text-surface-900">
            {t("hanOption", { count: rawTotal })}
          </td>
        </tr>
      </DataTable>

      {rawTotal !== correctHan && (
        <p className="text-right text-xs text-surface-500">
          {t("hanOption", { count: rawTotal })} &rarr; {t("yakuman")}（
          {t("yakumanNote")}）
        </p>
      )}
    </div>
  );
}

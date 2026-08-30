"use client";

import { useTranslations } from "next-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { BreakdownTable } from "../../_components/breakdown-table";
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
 * 合計が正解と一致しない場合（例: 16翻 → 役満）は丸めの補足を出す。
 */
export function HanBreakdown({ yakuDetails, correctHan }: HanBreakdownProps) {
  const t = useTranslations("hanCountChallenge");
  const yakuOrder = useYakuOrder();

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const rawTotal = ordered.reduce((sum, detail) => sum + detail.han, 0);
  // 内訳の合計と正解が食い違うのは役満への丸めだけ。それ以外で食い違ったら
  // （役の判定と点数計算が別の解釈を採った手など）丸めの補足は嘘になるので出さない
  const isClampedToYakuman =
    correctHan === YAKUMAN_HAN && rawTotal > correctHan;

  return (
    <BreakdownTable
      title={t("breakdownTitle")}
      rows={ordered.map((detail) => ({
        label: detail.name,
        value: t("hanOption", { count: detail.han }),
      }))}
      totalLabel={t("breakdownTotal")}
      totalValue={t("hanOption", { count: rawTotal })}
      note={
        isClampedToYakuman ? (
          <>
            {t("hanOption", { count: rawTotal })} &rarr; {t("yakuman")}（
            {t("yakumanNote")}）
          </>
        ) : undefined
      }
    />
  );
}

"use client";

import type { YakuDetail } from "@mahjong-scoring/core";
import type { BreakdownSurface } from "@mahjong-scoring/features/results/breakdown-props";
import { useYakumanRounding } from "@mahjong-scoring/features/practice/han-count/use-yakuman-rounding";
import { YakuBreakdown } from "../../_components/yaku-breakdown";

interface HanBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
  /** 開いた内訳の表を載せる面（既定 `raised`）。白い面の中に置くときは `sunken` */
  readonly surface?: BreakdownSurface;
}

/**
 * 翻数即答練習の翻数内訳表示
 * 翻内訳表示（翻数即答）
 *
 * 表そのものは点数系の問題別一覧と共通の {@link YakuBreakdown}（既定で閉じた
 * 開閉式）。この練習だけが持つのは役満への丸めで、13翻に丸めた正解と
 * 内訳の合計が食い違うときに、合計の下へ「13翻以上は 役満」を結論として据える。
 *
 * 結果ページの問題別詳細と、トレーニングの答え合わせ（盤面の選択肢の下）の
 * 両方から使う。同じ手を振り返るのに 2 つの表を覚えさせない。
 *
 * 結論を出す条件（正解が役満で、内訳の合計がそれを超えるときだけ）と文言は
 * モバイルと共有の `useYakumanRounding` が持つ。
 */
export function HanBreakdown({
  yakuDetails,
  correctHan,
  surface,
}: HanBreakdownProps) {
  // 役満への丸め（出す条件と文言）はモバイルと共有する
  const conclusion = useYakumanRounding(yakuDetails, correctHan);

  return (
    <YakuBreakdown
      yakuDetails={yakuDetails}
      conclusion={conclusion}
      surface={surface}
    />
  );
}

import type { YakuDetail } from "@mahjong-scoring/core";
import type { BreakdownSurface } from "@mahjong-scoring/features/results/breakdown-props";
import { useYakumanRounding } from "@mahjong-scoring/features/practice/han-count/use-yakuman-rounding";

import { YakuBreakdown } from "../../components/yaku-breakdown";

/**
 * 翻数即答練習の翻数内訳表示（web の `HanBreakdown`）
 * 翻内訳表示（翻数即答）
 *
 * 表そのものは共通の {@link YakuBreakdown}。この練習だけが持つのは役満への
 * 丸めで、13翻に丸めた正解と内訳の合計が食い違うときに、合計の下へ
 * 「13翻以上は 役満」を結論として据える。結果画面の問題別一覧とトレーニングの答え合わせの両方から使う。
 */
export function HanBreakdown({
  yakuDetails,
  correctHan,
  surface,
}: {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
  /** 開いた内訳の表を載せる面（既定 `raised`）。白い面の中に置くときは `sunken` */
  readonly surface?: BreakdownSurface;
}) {
  // 役満への丸め（出す条件と文言）は web と共有する
  const conclusion = useYakumanRounding(yakuDetails, correctHan);

  return (
    <YakuBreakdown
      yakuDetails={yakuDetails}
      conclusion={conclusion}
      surface={surface}
    />
  );
}

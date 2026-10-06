import type { YakuDetail } from "@mahjong-scoring/core";
import { useYakumanRoundingNote } from "@mahjong-scoring/features/practice/han-count/use-yakuman-rounding-note";

import { YakuBreakdown } from "../../components/yaku-breakdown";

/**
 * 翻数即答練習の翻数内訳表示（web の `HanBreakdown`）
 * 翻内訳表示（翻数即答）
 *
 * 表そのものは共通の {@link YakuBreakdown}。この練習だけが持つのは役満への
 * 丸めの補足で、13翻に丸めた正解と内訳の合計が食い違うときに「16翻 → 役満」と
 * 示す。結果画面の問題別一覧とトレーニングの答え合わせの両方から使う。
 */
export function HanBreakdown({
  yakuDetails,
  correctHan,
}: {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
}) {
  // 役満への丸めの補足（出す条件と文言）はwebと共有する
  const note = useYakumanRoundingNote(yakuDetails, correctHan);

  return <YakuBreakdown yakuDetails={yakuDetails} note={note} />;
}

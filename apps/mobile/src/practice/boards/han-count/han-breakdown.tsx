import { useTranslations } from "use-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";

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
  const t = useTranslations("hanCountChallenge");
  const tBreakdown = useTranslations("challenge.yakuBreakdown");

  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);
  const isClampedToYakuman =
    correctHan === YAKUMAN_HAN && rawTotal > correctHan;

  return (
    <YakuBreakdown
      yakuDetails={yakuDetails}
      note={
        isClampedToYakuman
          ? `${tBreakdown("han", { count: rawTotal })} → ${t("yakuman")}（${t("yakumanNote")}）`
          : undefined
      }
    />
  );
}

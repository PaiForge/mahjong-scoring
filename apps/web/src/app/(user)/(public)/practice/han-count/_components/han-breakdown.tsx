"use client";

import { useTranslations } from "next-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";
import { YakuBreakdown } from "../../_components/yaku-breakdown";

interface HanBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
}

/**
 * 翻数即答練習の翻数内訳表示
 * 翻内訳表示（翻数即答）
 *
 * 表そのものは点数系の問題別一覧と共通の {@link YakuBreakdown}（既定で閉じた
 * 開閉式）。この練習だけが持つのは役満への丸めの補足で、13翻に丸めた正解と
 * 内訳の合計が食い違うときに「16翻 → 役満」と示す。
 *
 * 合計が正解と食い違うのは役満への丸めだけ（翻数と内訳は出題側で揃えている。
 * core の `han-consistency.test.ts` 参照）。それ以外で食い違ったら丸めの補足は
 * 嘘になるので出さない。
 */
export function HanBreakdown({ yakuDetails, correctHan }: HanBreakdownProps) {
  const t = useTranslations("hanCountChallenge");
  const tBreakdown = useTranslations("challenge.yakuBreakdown");

  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);
  const isClampedToYakuman =
    correctHan === YAKUMAN_HAN && rawTotal > correctHan;

  return (
    <YakuBreakdown
      yakuDetails={yakuDetails}
      note={
        isClampedToYakuman ? (
          <>
            {tBreakdown("han", { count: rawTotal })} &rarr; {t("yakuman")}（
            {t("yakumanNote")}）
          </>
        ) : undefined
      }
    />
  );
}

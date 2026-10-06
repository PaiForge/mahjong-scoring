"use client";

import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

import { buildYakumanRoundingNote } from "./yakuman-rounding-note";

/**
 * 翻数即答の正解を役満に丸めた補足を辞書から引くフック
 * 役満丸め注記（翻数即答）
 *
 * 組み立てと出す条件は {@link buildYakumanRoundingNote}。辞書は use-intl から
 * 読むので、web（next-intl の Provider）とモバイルのどちらでも同じに動く。
 *
 * @param yakuDetails - 役の内訳（ドラ・裏ドラを含む）
 * @param correctHan - 正解の翻数（役満に丸めた後）
 */
export function useYakumanRoundingNote(
  yakuDetails: readonly YakuDetail[],
  correctHan: number,
): string | undefined {
  const hanCount = useTranslations("hanCountChallenge");
  const yakuBreakdown = useTranslations("challenge.yakuBreakdown");
  return buildYakumanRoundingNote(yakuDetails, correctHan, {
    hanCount,
    yakuBreakdown,
  });
}

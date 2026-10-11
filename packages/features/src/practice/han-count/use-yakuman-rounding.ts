"use client";

import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

import { buildYakumanRounding, type YakumanRounding } from "./yakuman-rounding";

/**
 * 翻数即答の正解を役満に丸めた結論の行を辞書から引くフック
 * 役満丸め（翻数即答）
 *
 * 組み立てと出す条件は {@link buildYakumanRounding}。辞書は use-intl から
 * 読むので、web（next-intl の Provider）とモバイルのどちらでも同じに動く。
 *
 * @param yakuDetails - 役の内訳（ドラ・裏ドラを含む）
 * @param correctHan - 正解の翻数（役満に丸めた後）
 */
export function useYakumanRounding(
  yakuDetails: readonly YakuDetail[],
  correctHan: number,
): YakumanRounding | undefined {
  const t = useTranslations("hanCountChallenge");
  return buildYakumanRounding(yakuDetails, correctHan, t);
}

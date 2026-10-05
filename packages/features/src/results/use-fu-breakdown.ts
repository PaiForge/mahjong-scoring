"use client";

import { useTranslations } from "use-intl";
import type { FuDetail } from "@mahjong-scoring/core";

import { buildFuBreakdown, type FuBreakdown } from "./fu-breakdown";

/**
 * 符の内訳の表に並べる文字列を辞書から引くフック
 * 符内訳表示
 *
 * 組み立ては {@link buildFuBreakdown}。辞書は use-intl から読むので、web
 * （next-intl の Provider）とモバイルのどちらでも同じに動く。
 *
 * @param details - 切り上げ前の符の内訳
 * @param answer - 切り上げ後の符（正解）
 * @param translationNamespace - `breakdownTitle` / `breakdownTotal` / `roundUp` /
 *   `fuSuffix` を持つ名前空間（例: "totalFu"）
 */
export function useFuBreakdown(
  details: readonly FuDetail[],
  answer: number,
  translationNamespace: string,
): FuBreakdown {
  const t = useTranslations(translationNamespace);
  return buildFuBreakdown(details, answer, t);
}

"use client";

import { useSearchParams } from "next/navigation";
import { normalizeYakuHanRange } from "@mahjong-scoring/core";
import type { YakuHanRange } from "@mahjong-scoring/core";
import { YAKU_HAN_RANGE_PARAM } from "../_lib/range-param";

/**
 * URL クエリから出題範囲を読むフック
 * URL 出題範囲
 *
 * 説明ページの開始パネルが付ける `range` を解釈する（不正値・未指定は既定範囲）。
 * サーバー側で `searchParams` を読むとルートが動的になり、初回表示が
 * `loading.tsx` のスケルトンを経由してしまうため、クライアントで読む。
 */
export function useYakuHanRangeQuery(): YakuHanRange {
  const searchParams = useSearchParams();
  return normalizeYakuHanRange(
    searchParams.get(YAKU_HAN_RANGE_PARAM) ?? undefined,
  );
}

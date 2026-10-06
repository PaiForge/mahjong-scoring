"use client";

import {
  useYakuOptions as useYakuOptionsFor,
  type YakuOption,
} from "@mahjong-scoring/features/yaku/use-yaku-options";
import { useYakuOrder } from "./use-yaku-order-store";

/**
 * 役の選択肢をユーザーの並び順で返すフック
 * 役選択肢取得
 *
 * 共有の `useYakuOptions` に web の役の並び設定ストアを渡す。
 */
export function useYakuOptions(): readonly YakuOption[] {
  return useYakuOptionsFor(useYakuOrder());
}

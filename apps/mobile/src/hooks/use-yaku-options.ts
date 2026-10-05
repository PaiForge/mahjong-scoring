import { useCallback, useMemo } from "react";
import { useTranslations } from "use-intl";
import { YAKU_TO_KEY } from "@mahjong-scoring/features/yaku/yaku-labels";

import { useYakuOrder } from "./use-yaku-order-store";

/** 役の選択肢 1 件 */
export interface YakuOption {
  readonly value: string;
  readonly label: string;
}

/**
 * 役名を表示名に変換する関数を返すフック
 * 役表示名取得
 *
 * web の `useYakuLabel` と同じ。選択肢・チップ・設定の並び替えが同じ表示名を
 * 出すため、変換をここに寄せる。
 */
export function useYakuLabel(): (yakuName: string) => string {
  const tYaku = useTranslations("score.yaku");

  return useCallback(
    (yakuName: string) => {
      const key = YAKU_TO_KEY[yakuName];
      return key ? tYaku(key) : yakuName;
    },
    [tYaku],
  );
}

/**
 * 役の選択肢をユーザーの並び順で返すフック
 * 役選択肢取得
 *
 * web の `useYakuOptions` と同じ。役の選択練習と点数計算練習が同じ並び・
 * 同じ表示名の選択肢を出すため、並びの取得と表示名の解決をここに寄せる。
 */
export function useYakuOptions(): readonly YakuOption[] {
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();

  return useMemo(
    () => yakuOrder.map((yaku) => ({ value: yaku, label: labelOf(yaku) })),
    [labelOf, yakuOrder],
  );
}

"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { YAKU_TO_KEY } from "@/app/_lib/yaku-labels";
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
 * 選択肢・チップ・設定の並び替えが同じ表示名を出すため、変換をここに寄せる。
 * 同じ役が画面ごとに違う名前で出ないようにするのが目的。
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
 * 役の選択練習と点数計算練習が同じ並び・同じ表示名の選択肢を出すため、
 * 並びの取得と表示名の解決をここに寄せる。
 */
export function useYakuOptions(): readonly YakuOption[] {
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();

  return useMemo(
    () => yakuOrder.map((yaku) => ({ value: yaku, label: labelOf(yaku) })),
    [labelOf, yakuOrder],
  );
}

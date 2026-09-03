import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeYakuOrder, YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

import { useHydrated } from "./use-hydrated";

interface YakuOrderState {
  /**
   * ユーザーが並び替えた役の順。未設定なら空配列。
   *
   * 既定順そのものを保存しないのは、既定順が変わったとき
   * （出題ロジックを変えて測り直したとき）に、並び替えていない
   * ユーザーへ新しい既定順を届けるため。
   */
  order: readonly string[];
  setOrder: (order: readonly string[]) => void;
  reset: () => void;
}

/**
 * 役の並び順ストア（端末ローカル永続化）
 * 役並び順ストア
 *
 * 役の選択練習と点数計算練習の選択肢の並びを決める。どちらの画面でも
 * 同じ位置に同じ役があるよう、画面ごとに持たず1つを共有する。
 */
export const useYakuOrderStore = create<YakuOrderState>()(
  persist(
    (set) => ({
      order: [],
      setOrder: (order) => set({ order }),
      reset: () => set({ order: [] }),
    }),
    { name: "mahjong-yaku-order" },
  ),
);

/**
 * 表示に使う役の並びを返すフック
 * 役並び順取得
 *
 * 保存値は {@link normalizeYakuOrder} を通すため、選択できる全役を
 * ちょうど1回ずつ含む。ハイドレーション完了までは既定順を返す
 * （理由は {@link useHydrated} 参照）。
 */
export function useYakuOrder(): readonly string[] {
  const saved = useYakuOrderStore((s) => s.order);
  const normalized = useMemo(() => normalizeYakuOrder(saved), [saved]);
  return useHydrated(normalized, YAKU_DEFAULT_ORDER);
}

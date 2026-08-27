import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeYakuOrder, YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

import { useIsClient } from "./use-is-client";

interface YakuOrderState {
  /**
   * ユーザーが並べ替えた役の順。未設定なら空配列。
   *
   * 既定順そのものを保存しないのは、既定順が変わったとき
   * （出題ロジックを変えて測り直したとき）に、並べ替えていない
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
 * （永続値はストア生成時に同期的に載るため、そのまま読むと SSR 済みの
 * HTML と初回クライアントレンダーがずれる）。
 */
export function useYakuOrder(): readonly string[] {
  const isClient = useIsClient();
  const saved = useYakuOrderStore((s) => s.order);
  return useMemo(
    () => (isClient ? normalizeYakuOrder(saved) : YAKU_DEFAULT_ORDER),
    [isClient, saved],
  );
}

/** ユーザーが並べ替えたことがあるか（設定 UI のリセット可否に使う） */
export function useHasCustomYakuOrder(): boolean {
  const isClient = useIsClient();
  const saved = useYakuOrderStore((s) => s.order);
  return isClient && saved.length > 0;
}

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeYakuOrder, YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "./settings-store-options";

/** 役の並び順ストアの状態と更新関数 */
export interface YakuOrderState {
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
 * 役の並び順ストアを作る（端末ローカル永続化）
 * 役並び順ストア生成
 *
 * 役の選択練習と点数計算練習の選択肢の並びを決める。どちらの画面でも
 * 同じ位置に同じ役があるよう、画面ごとに持たず1つを共有する。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先とハイドレーションガード（保存名は
 *   `mahjong-yaku-order` 固定）
 */
export function createYakuOrderStore({
  storage,
  useHydrated = passThroughHydration,
}: SettingsStoreOptions) {
  const useYakuOrderStore = create<YakuOrderState>()(
    persist(
      (set) => ({
        order: [],
        setOrder: (order) => set({ order }),
        reset: () => set({ order: [] }),
      }),
      { name: "mahjong-yaku-order", storage: createJSONStorage(storage) },
    ),
  );

  /**
   * 表示に使う役の並びを返すフック
   * 役並び順取得
   *
   * 保存値は `normalizeYakuOrder` を通すため、選択できる全役を
   * ちょうど1回ずつ含む。ハイドレーション完了までは既定順を返す
   * （`useHydrated` を渡した場合）。
   */
  function useYakuOrder(): readonly string[] {
    const saved = useYakuOrderStore((s) => s.order);
    const normalized = useMemo(() => normalizeYakuOrder(saved), [saved]);
    return useHydrated(normalized, YAKU_DEFAULT_ORDER);
  }

  return { useYakuOrderStore, useYakuOrder };
}

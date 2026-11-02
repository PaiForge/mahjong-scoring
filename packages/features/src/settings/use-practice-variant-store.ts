import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PracticeMenuSlug } from "../practice-menu-types";
import type { SettingsStoreOptions } from "./settings-store-options";

/** 前回の出題設定ストアの状態と更新関数 */
export interface PracticeVariantState {
  /**
   * 練習ごとに、最後にチャレンジかトレーニングを始めたときのバリアント
   *
   * 値はレジストリで検証していない生の文字列。読む側は
   * `resolveInitialPracticeVariant` を通す（列挙から消えた値は既定に落ちる）。
   */
  lastVariants: Partial<Record<PracticeMenuSlug, string>>;
  rememberVariant: (slug: PracticeMenuSlug, variant: string) => void;
}

/** 前回の範囲の読み出し結果 */
export interface RememberedPracticeVariant {
  /**
   * 保存値を読み終えたか
   *
   * 読み終えるまで初期選択を確定できない（既定で選択を描いてから保存値へ
   * 切り替えると、選択が目の前で動く）。呼び出し側は false の間スケルトンを出す。
   */
  readonly ready: boolean;
  /** 前回の範囲。始めたことが無ければ undefined */
  readonly variant: string | undefined;
}

/**
 * 前回の出題設定ストアを作る（端末ローカル永続化）
 * 前回出題設定ストア
 *
 * 出題範囲を選べる練習の説明ページは、前回チャレンジかトレーニングを
 * 始めたときの範囲を初期選択にする。結果ページからパンくずで戻っても、
 * 練習一覧から入り直しても、選んだ範囲が既定に戻らないようにするため。
 *
 * - 保存するのは開始ボタンを押したときだけで、選択肢を押しただけでは保存
 *   しない（試しに押して始めずに去った選択は覚えない）
 * - チャレンジとトレーニングで保存先を分けない。設定のパネルは 1 つで、
 *   範囲を決めて始めたことはどちらも同じため
 * - アカウントではなく端末に持つ。記録の土俵（`leaderboard_key`）は従来どおり
 *   URL の `?variant=` だけで決まり、この値は初期選択にしか効かない
 *
 * 読み終えたかは zustand の persist のハイドレーションで判定する。サーバー
 * 描画では常に未完了を返すので、web でもハイドレーション不一致を起こさない
 * （`useHydrated` のガードは使わない — 値の差し替えではなく「読み終えるまで
 * 描かない」ための判定で、非同期の保存先（モバイル）でも同じに働く必要がある）。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先（保存名は `mahjong-practice-variants` 固定）
 */
export function createPracticeVariantStore({ storage }: SettingsStoreOptions) {
  const usePracticeVariantStore = create<PracticeVariantState>()(
    persist(
      (set) => ({
        lastVariants: {},
        rememberVariant: (slug, variant) =>
          set((state) => ({
            lastVariants: { ...state.lastVariants, [slug]: variant },
          })),
      }),
      {
        name: "mahjong-practice-variants",
        storage: createJSONStorage(storage),
        partialize: (state) => ({ lastVariants: state.lastVariants }),
      },
    ),
  );

  const { persist: persistApi } = usePracticeVariantStore;
  const subscribeHydration = (onChange: () => void) =>
    persistApi.onFinishHydration(onChange);
  const getHydrated = () => persistApi.hasHydrated();
  const getServerHydrated = () => false;

  /**
   * その練習で前回始めたときの範囲を読むフック
   * 前回出題設定の読み出し
   */
  function useRememberedPracticeVariant(
    slug: PracticeMenuSlug,
  ): RememberedPracticeVariant {
    const ready = useSyncExternalStore(
      subscribeHydration,
      getHydrated,
      getServerHydrated,
    );
    const variant = usePracticeVariantStore((s) => s.lastVariants[slug]);
    return { ready, variant: ready ? variant : undefined };
  }

  return { usePracticeVariantStore, useRememberedPracticeVariant };
}

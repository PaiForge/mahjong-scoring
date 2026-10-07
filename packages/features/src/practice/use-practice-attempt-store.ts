import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PracticeAttempt } from "../journey/journey";
import {
  isPracticeMenuSlug,
  isPracticeVariantOf,
  type PracticeMenuSlug,
} from "../practice-menu-types";
import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "../settings/settings-store-options";

/** 端末に記録した「挑戦した練習」の状態と更新関数 */
export interface PracticeAttemptState {
  /**
   * 一度でもチャレンジを終えた練習（土俵ごとに 1 件）。終えた順に並ぶ
   *
   * 保存値は今のレジストリに無い練習・バリアントを含み得る（練習を消した
   * あとに古い保存値を読んだとき）。読む側は {@link createPracticeAttemptStore}
   * のフックを通して、今ある土俵だけを受け取る。
   */
  attempts: readonly PracticeAttempt[];
  /** チャレンジを終えたことを記録する。記録済みの土俵なら何もしない */
  markAttempted: (slug: PracticeMenuSlug, variant: string) => void;
}

/**
 * 挑戦した練習を端末に記録するストアを作る（端末ローカル永続化）
 * 練習挑戦ストア
 *
 * アカウントを持たないプラットフォーム（モバイル）が、黒帯への道の
 * 「練習した」の材料として使う。web はチャレンジの記録（`practice_results`）
 * から引くが、モバイルはチャレンジを記録しない（記録・ランキングは
 * アカウントに紐づく）。ここに残すのは成績ではなく「終えた」という事実
 * だけで、web と同じく一度でも挑戦すれば済みになる。これが無いと行程が
 * 最初の練習で止まり、ホームの「次にやること」が先へ進まない。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先とハイドレーションガード（保存名は
 *   `mahjong-practice-attempts` 固定）
 */
export function createPracticeAttemptStore({
  storage,
  useHydrated = passThroughHydration,
}: SettingsStoreOptions) {
  const usePracticeAttemptStore = create<PracticeAttemptState>()(
    persist(
      (set) => ({
        attempts: [],
        markAttempted: (slug, variant) =>
          set((state) =>
            state.attempts.some(
              (attempt) => attempt.slug === slug && attempt.variant === variant,
            )
              ? state
              : { attempts: [...state.attempts, { slug, variant }] },
          ),
      }),
      {
        name: "mahjong-practice-attempts",
        storage: createJSONStorage(storage),
      },
    ),
  );

  const EMPTY: readonly PracticeAttempt[] = [];

  /**
   * 挑戦した練習の一覧を返すフック
   * 挑戦済み練習取得
   *
   * 今のレジストリにある土俵だけを返す。ハイドレーション完了までは空配列を
   * 返す（`useHydrated` を渡した場合）。
   */
  function useAttemptedPractices(): readonly PracticeAttempt[] {
    const saved = usePracticeAttemptStore((s) => s.attempts);
    const attempts = useMemo(
      () =>
        saved.filter(
          (attempt) =>
            isPracticeMenuSlug(attempt.slug) &&
            isPracticeVariantOf(attempt.slug, attempt.variant),
        ),
      [saved],
    );
    return useHydrated(attempts, EMPTY);
  }

  return { usePracticeAttemptStore, useAttemptedPractices };
}

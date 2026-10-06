import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  isCurriculumChapterSlug,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "../settings/settings-store-options";

/** 端末に記録したレッスンの完了の状態と更新関数 */
export interface LessonCompletionState {
  /**
   * 完了したレッスン（章の slug）。完了した順に並ぶ
   *
   * 保存値はカリキュラムから外れた slug を含み得る（章を消したあとに
   * 古い保存値を読んだとき）。読む側は {@link createLessonCompletionStore} の
   * フックを通して、今のカリキュラムにある章だけを受け取る。
   */
  completedSlugs: readonly string[];
  /** レッスンを完了にする。完了済みなら何もしない（取り消しは無い） */
  markCompleted: (slug: CurriculumChapterSlug) => void;
}

/**
 * レッスンの完了を端末に記録するストアを作る（端末ローカル永続化）
 * レッスン完了ストア生成
 *
 * アカウントを持たないプラットフォーム（モバイル）が、web の
 * `lesson_completions` の代わりに使う。記録するのは web と同じく「終えた」
 * という事実だけで、正答数は持たない。完了は取り組んだ印で、取り消しは無い。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先とハイドレーションガード（保存名は
 *   `mahjong-lesson-completions` 固定）
 */
export function createLessonCompletionStore({
  storage,
  useHydrated = passThroughHydration,
}: SettingsStoreOptions) {
  const useLessonCompletionStore = create<LessonCompletionState>()(
    persist(
      (set) => ({
        completedSlugs: [],
        markCompleted: (slug) =>
          set((state) =>
            state.completedSlugs.includes(slug)
              ? state
              : { completedSlugs: [...state.completedSlugs, slug] },
          ),
      }),
      {
        name: "mahjong-lesson-completions",
        storage: createJSONStorage(storage),
      },
    ),
  );

  const EMPTY: ReadonlySet<CurriculumChapterSlug> = new Set();

  /**
   * 完了したレッスンの集合を返すフック
   * 完了レッスン取得
   *
   * 今のカリキュラムにある章だけを返す（目次の進捗の分子が分母を超えない）。
   * ハイドレーション完了までは空集合を返す（`useHydrated` を渡した場合）。
   */
  function useCompletedLessonSlugs(): ReadonlySet<CurriculumChapterSlug> {
    const saved = useLessonCompletionStore((s) => s.completedSlugs);
    const slugs = useMemo(
      () => new Set(saved.filter(isCurriculumChapterSlug)),
      [saved],
    );
    return useHydrated(slugs, EMPTY);
  }

  /**
   * そのレッスンを完了しているかを返すフック
   * レッスン完了判定
   *
   * @param slug 対象のレッスン（章の slug）
   */
  function useLessonCompleted(slug: CurriculumChapterSlug): boolean {
    const completed = useLessonCompletionStore((s) =>
      s.completedSlugs.includes(slug),
    );
    return useHydrated(completed, false);
  }

  return {
    useLessonCompletionStore,
    useCompletedLessonSlugs,
    useLessonCompleted,
  };
}

import { createLessonCompletionStore } from "@mahjong-scoring/features/lessons/use-lesson-completion-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * レッスンの完了の記録（モバイル・AsyncStorage に永続化）
 * レッスン完了ストア
 *
 * モバイルにはアカウントが無いので、web がサーバーに記録する
 * `lesson_completions` の代わりに完了を端末に残す。
 */
export const {
  useLessonCompletionStore,
  useCompletedLessonSlugs,
  useLessonCompleted,
} = createLessonCompletionStore(MOBILE_SETTINGS_STORE_OPTIONS);

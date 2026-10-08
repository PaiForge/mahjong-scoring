import { createLessonCompletionStore } from "@mahjong-scoring/features/lessons/use-lesson-completion-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * レッスンの完了の記録（モバイル・AsyncStorage に永続化）
 * レッスン完了ストア
 *
 * ゲスト（ログインしていないとき）の完了を端末に残す。web がサーバーに
 * 記録する `lesson_completions` の代わり。ログイン中の完了はここに書かず、
 * アカウントの未送信（`records/account-records.ts`）からサーバーへ送る。
 * ここにあるゲストの完了は、端末で 1 度だけ最初にログインしたアカウントへ
 * 取り込む。
 */
export const {
  useLessonCompletionStore,
  useCompletedLessonSlugs,
  useLessonCompleted,
} = createLessonCompletionStore(MOBILE_SETTINGS_STORE_OPTIONS);

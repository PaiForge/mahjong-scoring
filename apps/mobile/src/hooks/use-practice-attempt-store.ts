import { createPracticeAttemptStore } from "@mahjong-scoring/features/practice/use-practice-attempt-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 挑戦した練習の記録（モバイル・AsyncStorage に永続化）
 * 練習挑戦ストア
 *
 * モバイルはチャレンジの成績を記録しないが、黒帯への道の「練習した」を
 * 進めるために「終えた」という事実だけを端末に残す。
 */
export const { usePracticeAttemptStore, useAttemptedPractices } =
  createPracticeAttemptStore(MOBILE_SETTINGS_STORE_OPTIONS);

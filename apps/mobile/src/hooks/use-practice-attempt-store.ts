import { createPracticeAttemptStore } from "@mahjong-scoring/features/practice/use-practice-attempt-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 挑戦した練習の記録（モバイル・AsyncStorage に永続化）
 * 練習挑戦ストア
 *
 * ゲスト（ログインしていないとき）のチャレンジは成績を記録しないが、黒帯への
 * 道の「練習した」を進めるために「終えた」という事実だけを端末に残す。
 * ログイン中のチャレンジはサーバーが記録するのでここには書かない。ここの
 * 記録はサーバーへ送らず、ログイン中もこの端末の案内にだけ合わせて使う。
 */
export const { usePracticeAttemptStore, useAttemptedPractices } =
  createPracticeAttemptStore(MOBILE_SETTINGS_STORE_OPTIONS);

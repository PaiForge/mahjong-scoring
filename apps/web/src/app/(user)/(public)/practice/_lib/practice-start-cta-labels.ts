import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";

import type { PracticeStartCtaLabels } from "../_components/practice-start-cta";

/** next-intl の翻訳関数（`useTranslations` / `getTranslations` の戻り値） */
type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * 練習の開始導線に出す文言を組み立てる
 * 開始導線文言
 *
 * 「どの名前空間のどのキーを引くか」「チャレンジの補足に制限時間とミス上限を
 * 差し込む」という知識の唯一の定義。説明ページ（サーバー）と設定パネル
 * （クライアント）の双方から使えるよう、翻訳関数を受け取る純粋関数にしている。
 */
export function buildPracticeStartCtaLabels(t: {
  /** "challenge" 名前空間 */
  readonly challenge: Translator;
  /** "practice" 名前空間 */
  readonly practice: Translator;
  /** "training" 名前空間 */
  readonly training: Translator;
}): PracticeStartCtaLabels {
  return {
    challenge: t.challenge("startButton"),
    challengeHint: t.practice("modeChallengeHint", {
      timeLimit: CHALLENGE_TIME_LIMIT,
      mistakeLimit: MISTAKE_LIMIT,
    }),
    training: t.training("startButton"),
    trainingHint: t.practice("modeTrainingHint"),
    orDivider: t.practice("orDivider"),
  };
}

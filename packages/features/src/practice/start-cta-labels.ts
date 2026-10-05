import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";

/** 開始導線に表示する文言 */
export interface PracticeStartCtaLabels {
  /** チャレンジ開始ボタン（challenge.startButton） */
  readonly challenge: string;
  /** チャレンジの補足（practice.modeChallengeHint） */
  readonly challengeHint: string;
  /** トレーニング開始ボタン（training.startButton） */
  readonly training: string;
  /** トレーニングの補足（practice.modeTrainingHint） */
  readonly trainingHint: string;
  /** 2つの導線の区切り（practice.orDivider） */
  readonly orDivider: string;
}

/** 翻訳関数（web の `useTranslations` / `getTranslations`、モバイルの `useTranslations` の戻り値） */
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
 * （クライアント）、モバイルの説明画面から使えるよう、翻訳関数を受け取る純粋関数にしている。
 *
 * @param challengeRules - 練習ごとのチャレンジのルール（レジストリの記述子から渡す）。
 *   省略時は共通の制限時間・ミス上限。上限の異なる練習（昇級試験等）で
 *   ヒント文言が実際のルールとずれないよう、記述子を持つ呼び出し元は渡すこと
 */
export function buildPracticeStartCtaLabels(
  t: {
    /** "challenge" 名前空間 */
    readonly challenge: Translator;
    /** "practice" 名前空間 */
    readonly practice: Translator;
    /** "training" 名前空間 */
    readonly training: Translator;
  },
  challengeRules?: {
    readonly timeLimit: number;
    readonly mistakeLimit: number;
  },
): PracticeStartCtaLabels {
  return {
    challenge: t.challenge("startButton"),
    challengeHint: t.practice("modeChallengeHint", {
      timeLimit: challengeRules?.timeLimit ?? CHALLENGE_TIME_LIMIT,
      mistakeLimit: challengeRules?.mistakeLimit ?? MISTAKE_LIMIT,
    }),
    training: t.training("startButton"),
    trainingHint: t.practice("modeTrainingHint"),
    orDivider: t.practice("orDivider"),
  };
}

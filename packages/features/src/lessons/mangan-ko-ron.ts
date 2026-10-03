import { HIGH_SCORES, hanRangeOf } from "@mahjong-scoring/core";

/**
 * 「子のロン（満貫以上）」レッスンの確認問題 1 問
 * レッスン確認問題
 *
 * 翻数を示して、子がロンしたときの点数を選ばせる。
 */
export interface ManganKoRonLessonQuestion {
  /**
   * 問う点数の帯（満貫・跳満・倍満 …）。`HIGH_SCORES` の `nameKey` と同じで、
   * 帯の名前（`scoreTable.<tierKey>`）とヒント・解説の辞書キー
   * （`lessons.manganKoRon.questions.<tierKey>`）を引く
   */
  readonly tierKey: string;
  /** 提示する翻数（その帯の最小翻数） */
  readonly han: number;
  /** 正解の点数（子のロン） */
  readonly answer: number;
}

/**
 * 確認問題で問う帯（出題順）
 *
 * 満貫 → 跳満 → 倍満 の 3 問。基準（満貫）→ 1.5 倍 → 2 倍 と倍率が
 * 素直に進む並びで、三倍満・役満は説明と選択肢で目にするだけに留める。
 * 3 問に収めるのは、登録直後の最初の一歩を「数分で終わる」大きさに保つため。
 */
const QUESTION_TIER_KEYS = ["mangan", "haneman", "baiman"] as const;

/**
 * 「子のロン（満貫以上）」レッスンの選択肢（満貫〜役満の子のロンの点数、昇順）
 * レッスン選択肢
 *
 * 点数は core の `HIGH_SCORES`（ライブラリからの導出）を使い、ここに
 * 8000 / 12000 … を直書きしない。説明に出す早見表と同じ出所なので、
 * 表で見た値がそのまま選択肢に並ぶ。
 */
export const MANGAN_KO_RON_LESSON_CHOICES: readonly number[] = HIGH_SCORES.map(
  (row) => row.ronKo,
);

/**
 * 「子のロン（満貫以上）」レッスンの確認問題（出題順）
 * レッスン確認問題一覧
 */
export const MANGAN_KO_RON_LESSON_QUESTIONS: readonly ManganKoRonLessonQuestion[] =
  QUESTION_TIER_KEYS.map((tierKey) => {
    const row = HIGH_SCORES.find((entry) => entry.nameKey === tierKey);
    const range = hanRangeOf(tierKey);
    if (row === undefined || range === undefined) {
      throw new Error(`HIGH_SCORES に ${tierKey} の帯がない`);
    }
    return { tierKey, han: range.min, answer: row.ronKo };
  });

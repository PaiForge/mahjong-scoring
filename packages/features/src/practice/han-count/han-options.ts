import { YAKUMAN_HAN } from "@mahjong-scoring/core";

/**
 * 翻数即答練習の選択肢（1翻〜役満）
 * 翻数選択肢
 *
 * 出題盤面と遊び方デモで同じ選択肢を出すため、両者からここを引く
 * （machi-fu の MACHI_FU_OPTIONS と同じ位置づけ）。
 */
export const HAN_OPTIONS: readonly number[] = Array.from(
  { length: YAKUMAN_HAN },
  (_, i) => i + 1,
);

/**
 * 翻数即答練習の翻数表示ラベル
 * 翻数ラベル
 *
 * 13翻以上はすべて役満（数え役満・ダブル役満含む）なので「役満」と表記する。
 * 回答フォーム・遊び方デモ・結果一覧で表記を揃えるため、翻数を表示する箇所は
 * すべてここを通す。比較を `===` でなく `>=` にしているのは、丸め漏れの値が
 * 紛れても「14翻」のような存在しない選択肢として表示しないための防御。
 *
 * @param t - `hanOption` / `yakuman` キーを持つ翻訳関数（hanCountChallenge）
 */
export function hanCountLabel(
  han: number,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  return han >= YAKUMAN_HAN ? t("yakuman") : t("hanOption", { count: han });
}

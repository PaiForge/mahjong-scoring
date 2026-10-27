import { isYakumanHan } from "@mahjong-scoring/core";

/**
 * 翻数の選択肢の表記（「n翻」か「役満」）
 * 翻数ラベル
 *
 * 翻数即答・役翻数の両練習の回答フォーム・遊び方デモ・問題別一覧で表記を揃えるため、
 * 選択肢の翻数を表示する箇所はすべてここを通す。13翻以上はすべて役満（数え役満・
 * ダブル役満含む）なので「役満」と表記する。名前空間は呼び手の `t` が決める。
 * 選択肢の値域（`HAN_COUNT_OPTIONS` / `YAKU_HAN_OPTIONS`）は練習ごとに違うので
 * それぞれのモジュールに残す。
 *
 * @param t - `hanOption` / `yakuman` キーを持つ翻訳関数（hanCountChallenge / yakuHanChallenge）
 */
export function hanOptionLabel(
  han: number,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  return isYakumanHan(han) ? t("yakuman") : t("hanOption", { count: han });
}

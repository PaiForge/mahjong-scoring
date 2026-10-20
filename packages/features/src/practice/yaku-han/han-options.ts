import { YAKUMAN_HAN, isYakumanHan } from "@mahjong-scoring/core";

/**
 * 役翻数練習の選択肢（1〜6翻 + 役満）
 * 役翻数選択肢
 *
 * 出題盤面の回答フォームと問題別一覧で同じ選択肢・同じ表記を使うため、
 * web とモバイルの両方からここを引く（翻数即答の `HAN_COUNT_OPTIONS` と
 * 同じ位置づけ）。
 *
 * 翻数即答の `HAN_COUNT_OPTIONS`（1翻〜役満の全段）と値域が違うのは意図したもので、
 * 役 1 つの翻数を答える役翻数練習では、出題される役が取り得る翻数（1〜6翻と役満）
 * だけを並べる。合計翻数を答える翻数即答とは問う対象が違うため、選択肢を共有しない。
 */
export const YAKU_HAN_OPTIONS = [1, 2, 3, 4, 5, 6, YAKUMAN_HAN] as const;

/**
 * 役翻数の選択肢の表記（「n翻」か「役満」）
 * 役翻数表記
 *
 * 回答フォームと問題別一覧で同じ表記にする。
 *
 * @param t - `hanOption` / `yakuman` キーを持つ翻訳関数（yakuHanChallenge）
 */
export function yakuHanLabel(
  han: number,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  return isYakumanHan(han) ? t("yakuman") : t("hanOption", { count: han });
}

/**
 * 出題の手が門前か鳴きかの表記（「門前」か「鳴き」）
 * 役翻数状態表記
 *
 * 出題のバッジと問題別一覧で同じ表記にするため、web とモバイルの両方から
 * ここを引く。
 *
 * @param t - `menzen` / `naki` キーを持つ翻訳関数（yakuHanChallenge）
 */
export function yakuHanStateLabel(
  isMenzen: boolean,
  t: (key: string) => string,
): string {
  return isMenzen ? t("menzen") : t("naki");
}

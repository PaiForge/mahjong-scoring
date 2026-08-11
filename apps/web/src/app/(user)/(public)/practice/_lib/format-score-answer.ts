import type { ScoreTableAnswer } from "@mahjong-scoring/core";

/**
 * 点数系練習の回答を表示用文字列に変換する
 * 点数回答フォーマット
 *
 * ツモは支払いの内訳（"2000/4000" / "4000オール"）が単位を兼ねるため
 * 接尾辞を付けない。ロンだけは文脈により「点」を付けたい箇所があるため
 * `ronSuffix` で指定する。
 *
 * @param answer - 回答データ
 * @param t - 翻訳関数（"all" キーを含むネームスペース）
 * @param options.ronSuffix - ロンの点数に付ける接尾辞（既定: なし）
 */
export function formatScoreAnswer(
  answer: ScoreTableAnswer,
  t: (key: string) => string,
  options: { readonly ronSuffix?: string } = {},
): string {
  switch (answer.type) {
    case "ron":
      return `${answer.score}${options.ronSuffix ?? ""}`;
    case "oyaTsumo":
      return `${answer.scoreAll}${t("all")}`;
    case "koTsumo":
      return `${answer.scoreFromKo}/${answer.scoreFromOya}`;
  }
}

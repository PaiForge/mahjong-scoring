import type { ScoreTableAnswer } from "@mahjong-scoring/core";

/**
 * 点数系練習の回答を表示用文字列に変換する
 * 点数回答フォーマット
 *
 * @param answer - 回答データ
 * @param t - 翻訳関数（"all" キーを含むネームスペース）
 */
export function formatScoreAnswer(
  answer: ScoreTableAnswer,
  t: (key: string) => string,
): string {
  switch (answer.type) {
    case "ron":
      return `${answer.score}`;
    case "oyaTsumo":
      return `${answer.scoreAll}${t("all")}`;
    case "koTsumo":
      return `${answer.scoreFromKo}/${answer.scoreFromOya}`;
  }
}

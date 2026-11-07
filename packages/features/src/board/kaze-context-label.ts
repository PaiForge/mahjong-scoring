import {
  kazeNameKey,
  type KazeNameKey,
  type Kazehai,
} from "@mahjong-scoring/core";

/** `common` 名前空間の翻訳関数のうち、ここで引く語（場・家と風の名前） */
type KazeTranslator = (
  key: "round" | "wind" | `kazeNames.${KazeNameKey}`,
) => string;

/**
 * 「東場 南家」のような場況のラベル
 * 場況ラベル
 *
 * 場風と自風の名前を辞書の `common.kazeNames.<key>`（キーは core の `kazeNameKey`）
 * から引き、`common.round`（場）・`common.wind`（家）を添える。core の
 * `getKazeName`（日本語固定）を使わないのは、英語のページに漢字を残さないため。
 * 日本語の辞書の値は `getKazeName` と同じ文字列なので、日本語の出力は変わらない
 * （`kaze-context-label.test.ts` が固定する）。盤面の情報行（`TehaiDisplay`）と
 * 雀頭符の結果一覧の見出しが同じ文字列を出すので、組み立てはここ 1 か所に置く。
 *
 * @param bakaze 場風
 * @param jikaze 自風
 * @param t `common` 名前空間の翻訳関数
 */
export function kazeContextLabel(
  bakaze: Kazehai,
  jikaze: Kazehai,
  t: KazeTranslator,
): string {
  // 例: common.kazeNames.ton（完成形のキーで grep したときにここへ着地させるための例）
  const bakazeName = t(`kazeNames.${kazeNameKey(bakaze)}`);
  const jikazeName = t(`kazeNames.${kazeNameKey(jikaze)}`);
  return `${bakazeName}${t("round")} ${jikazeName}${t("wind")}`;
}

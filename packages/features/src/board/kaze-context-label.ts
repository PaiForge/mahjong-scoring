import { getKazeName, type Kazehai } from "@mahjong-scoring/core";

/** `common` 名前空間の翻訳関数のうち、ここで引く 2 語 */
type KazeTranslator = (key: "round" | "wind") => string;

/**
 * 「東場 南家」のような場況のラベル
 * 場況ラベル
 *
 * 場風と自風を core の `getKazeName` で読み、`common.round`（場）・`common.wind`
 * （家）を添える。盤面の情報行（`TehaiDisplay`）と雀頭符の結果一覧の見出しが
 * 同じ文字列を出すので、組み立てはここ 1 か所に置く。
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
  return `${getKazeName(bakaze)}${t("round")} ${getKazeName(jikaze)}${t("wind")}`;
}

import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";

/** `hanCountChallenge` の翻訳関数（`yakuman` / `yakumanRoundedLabel`） */
type HanCountTranslator = (key: string) => string;

/** 翻数の内訳の合計の下に据える、役満に丸めた後の行。例: 「13翻以上は」「役満」 */
export interface YakumanRounding {
  readonly label: string;
  readonly value: string;
}

/**
 * 翻数即答の正解を役満に丸めた結論の行を組み立てる
 * 役満丸め（翻数即答）
 *
 * 翻数即答は 13 翻以上を役満（13翻）に丸めた値を正解にする。役の内訳の合計が
 * 丸めた正解を超えるときだけ、合計の下に「13翻以上は 役満」を結論として据える。
 * 符の内訳の「切り上げ後 40符」と同じ形で、内訳の合計（16翻）と答え（役満）の
 * どちらが正解かを一目で読ませる。以前は表の下の小さな補足（「16翻 → 役満
 * （13翻以上は役満）」）で、合計の 16翻 のほうが答えに見えた。
 *
 * 合計が正解と食い違うのは役満への丸めだけ（翻数と内訳は出題側で揃えている。
 * core の `han-consistency.test.ts` 参照）。それ以外で食い違ったら丸めの結論は
 * 嘘になるので出さない。
 *
 * 支払いの役満倍率から打ち止め先を決める `buildYakumanCapNote`
 * （`results/yakuman-cap-note.ts`）とは別の契約。あちらは点数の支払いが
 * 役満何個分かを見るが、こちらは翻数即答の正解（翻数）への丸めだけを見る。
 *
 * @param yakuDetails - 役の内訳（ドラ・裏ドラを含む）
 * @param correctHan - 正解の翻数（役満に丸めた後）
 * @param t - `hanCountChallenge` の翻訳関数
 */
export function buildYakumanRounding(
  yakuDetails: readonly YakuDetail[],
  correctHan: number,
  t: HanCountTranslator,
): YakumanRounding | undefined {
  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);
  if (correctHan !== YAKUMAN_HAN || rawTotal <= correctHan) return undefined;

  return { label: t("yakumanRoundedLabel"), value: t("yakuman") };
}

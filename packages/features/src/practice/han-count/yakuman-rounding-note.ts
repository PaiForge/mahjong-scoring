import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuDetail } from "@mahjong-scoring/core";

/** 翻訳関数（件数・値の補間を含む） */
type Translator = (key: string, values?: Record<string, number>) => string;

/** 丸めの補足に要る 2 つの名前空間の翻訳関数 */
export interface YakumanRoundingNoteTranslators {
  /** `hanCountChallenge`（`yakuman` / `yakumanNote`） */
  readonly hanCount: Translator;
  /** `challenge.yakuBreakdown`（`han` の件数補間） */
  readonly yakuBreakdown: Translator;
}

/**
 * 翻数即答の正解を役満に丸めた補足を組み立てる
 * 役満丸め注記（翻数即答）
 *
 * 翻数即答は 13 翻以上を役満（13翻）に丸めた値を正解にする。役の内訳の合計が
 * 丸めた正解を超えるときだけ「16翻 → 役満（13翻以上は役満）」と示す。
 *
 * 合計が正解と食い違うのは役満への丸めだけ（翻数と内訳は出題側で揃えている。
 * core の `han-consistency.test.ts` 参照）。それ以外で食い違ったら丸めの補足は
 * 嘘になるので出さない。
 *
 * 支払いの役満倍率から打ち止め先を決める `buildYakumanCapNote`
 * （`results/yakuman-cap-note.ts`）とは別の契約。あちらは点数の支払いが
 * 役満何個分かを見るが、こちらは翻数即答の正解（翻数）への丸めだけを見る。
 *
 * @param yakuDetails - 役の内訳（ドラ・裏ドラを含む）
 * @param correctHan - 正解の翻数（役満に丸めた後）
 * @param t - 2 つの名前空間の翻訳関数
 */
export function buildYakumanRoundingNote(
  yakuDetails: readonly YakuDetail[],
  correctHan: number,
  t: YakumanRoundingNoteTranslators,
): string | undefined {
  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);
  if (correctHan !== YAKUMAN_HAN || rawTotal <= correctHan) return undefined;

  return `${t.yakuBreakdown("han", { count: rawTotal })} → ${t.hanCount("yakuman")}（${t.hanCount("yakumanNote")}）`;
}

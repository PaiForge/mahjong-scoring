import type { ScoreRange } from "@mahjong-scoring/core";

import {
  RANGE_PARAM,
  RANGE_TOKEN_MANGAN_PLUS,
  RANGE_TOKEN_NON_MANGAN,
} from "../../_lib/range-params";
import { YAKU_PARAM, yakuTokenOf } from "./yaku-filter-params";

/**
 * 出題条件付きの点数計算自由練習（play）へのリンクを組み立てる
 * 点数計算練習リンク
 *
 * 教本から「平和のみ・満貫未満」のように絞って遷移するときに使う。
 * score の設定画面はクエリを読まないため、リンク先は play 直。
 * 省略した軸は全選択（= パラメータを出さない）。受け取り側は未知の
 * トークンを黙って捨てるため、URL の語彙をここ以外で組み立てないこと
 * （`scoreTablePracticeHref` と同じ方針）。
 *
 * @param picks.yaku 出題する役（日本語役名、OR）。allowlist 外の役は無視される
 * @param picks.ranges 出題する点数帯
 */
export function scorePracticePlayHref(picks: {
  readonly yaku?: readonly string[];
  readonly ranges?: readonly ScoreRange[];
}): string {
  const params = new URLSearchParams();

  for (const name of picks.yaku ?? []) {
    const token = yakuTokenOf(name);
    if (token !== undefined) params.append(YAKU_PARAM, token);
  }

  const ranges = picks.ranges;
  if (ranges !== undefined && ranges.length > 0) {
    if (ranges.includes("nonMangan"))
      params.append(RANGE_PARAM, RANGE_TOKEN_NON_MANGAN);
    if (ranges.includes("manganPlus"))
      params.append(RANGE_PARAM, RANGE_TOKEN_MANGAN_PLUS);
  }

  const query = params.toString();
  return query ? `/practice/score/play?${query}` : "/practice/score/play";
}

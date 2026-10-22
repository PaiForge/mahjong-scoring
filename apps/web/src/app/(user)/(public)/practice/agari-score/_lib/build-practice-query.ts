import type { ScoreRange } from "@mahjong-scoring/core";
import {
  RANGE_PARAM,
  RANGE_TOKEN_MANGAN_PLUS,
  RANGE_TOKEN_NON_MANGAN,
} from "../../_lib/range-params";
import {
  ROLE_PARAM,
  ROLE_TOKEN_KO,
  ROLE_TOKEN_OYA,
} from "../../_lib/role-params";
import { YAKU_PARAM, yakuTokenOf } from "./yaku-filter-params";

/** 設定画面の値のうち、play ページの URL に載せるもの */
export interface ScorePracticeQueryInput {
  readonly requireYaku: boolean;
  readonly requireHanFu: boolean;
  readonly exactHan: boolean;
  readonly requireFuForMangan: boolean;
  readonly measureTime: boolean;
  readonly targetScoreRanges: readonly ScoreRange[];
  readonly includeParent: boolean;
  readonly includeChild: boolean;
  readonly targetYaku: readonly string[];
}

/**
 * 点数計算練習の設定を play ページのクエリに組む
 * 練習設定のクエリ化
 *
 * 読む側は `parseGeneratorOptionsFromParams` / `parseModeFlagsFromParams`。
 *
 * - 5翻以上の答え方と満貫以上の符は、翻数と符を答えるときだけ意味を持つ
 * - 回答時間の計測は Pro の特典。Pro でなければ付けない（保存された値は
 *   Pro になったときに生きる）
 * - 点数帯は両方選んだ（= 絞らない）ときは載せない
 * - 役の絞り込みは聴牌形の点数計算では持たない（`includeYakuFilter`）
 *
 * @returns `?` を除いたクエリ文字列。空なら何も載せない
 */
export function buildScorePracticeQuery(
  input: ScorePracticeQueryInput,
  options: {
    readonly hasPracticeTools: boolean;
    readonly includeYakuFilter: boolean;
  },
): string {
  const params = new URLSearchParams();
  if (input.requireYaku) params.set("mode", "with_yaku");
  if (input.requireHanFu) {
    params.set("han_fu", "1");
    if (input.exactHan) params.set("exact_han", "1");
    if (input.requireFuForMangan) params.set("fu_mangan", "1");
  }
  if (input.measureTime && options.hasPracticeTools) params.set("measure", "1");
  const { targetScoreRanges } = input;
  if (targetScoreRanges.length > 0 && targetScoreRanges.length < 2) {
    if (targetScoreRanges.includes("nonMangan"))
      params.append(RANGE_PARAM, RANGE_TOKEN_NON_MANGAN);
    if (targetScoreRanges.includes("manganPlus"))
      params.append(RANGE_PARAM, RANGE_TOKEN_MANGAN_PLUS);
  }
  if (input.includeParent) params.append(ROLE_PARAM, ROLE_TOKEN_OYA);
  if (input.includeChild) params.append(ROLE_PARAM, ROLE_TOKEN_KO);
  if (options.includeYakuFilter) {
    for (const name of input.targetYaku) {
      const token = yakuTokenOf(name);
      if (token !== undefined) params.append(YAKU_PARAM, token);
    }
  }
  return params.toString();
}

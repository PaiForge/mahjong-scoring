import type {
  QuestionGeneratorOptions,
  ScoreRange,
} from "@mahjong-scoring/core";

import { RANGE_PARAM, parseRangeValues } from "../../_lib/range-params";

/**
 * 無限練習（score）のクエリパラメータから問題生成オプションを組み立てる
 * 練習パラメータ解析
 *
 * - `ranges`: "non" / "plus" の複数指定。未指定時は両方
 * - `roles`: "oya" / "ko" の複数指定。未指定時は両方
 */
export function parseGeneratorOptionsFromParams(
  params: URLSearchParams,
): Pick<
  QuestionGeneratorOptions,
  "allowedRanges" | "includeParent" | "includeChild"
> {
  const ranges = parseRangeValues(params.getAll(RANGE_PARAM));
  const allowedRanges: ScoreRange[] = [];
  if (ranges.includeNonMangan) allowedRanges.push("nonMangan");
  if (ranges.includeManganPlus) allowedRanges.push("manganPlus");

  let includeParent = true;
  let includeChild = true;
  const rolesValues = params.getAll("roles");
  if (rolesValues.length > 0) {
    includeParent = rolesValues.includes("oya");
    includeChild = rolesValues.includes("ko");
  }

  return { allowedRanges, includeParent, includeChild };
}

/** 無限練習（score）の判定モードフラグ */
export interface ScorePracticeModeFlags {
  /** 役の回答を必須にする */
  readonly requireYaku: boolean;
  /** 満貫以上の翻数を簡略化して判定する */
  readonly simplifyMangan: boolean;
  /** 満貫以上でも符の回答を必須にする */
  readonly requireFuForMangan: boolean;
  /** 正解時に自動で次の問題へ進む */
  readonly autoNext: boolean;
}

/**
 * 無限練習（score）のクエリパラメータから判定モードフラグを読み取る
 * 判定モード解析
 */
export function parseModeFlagsFromParams(
  params: URLSearchParams,
): ScorePracticeModeFlags {
  return {
    requireYaku: params.get("mode") === "with_yaku",
    simplifyMangan: params.get("simple") === "1",
    requireFuForMangan: params.get("fu_mangan") === "1",
    autoNext: params.get("auto_next") === "1",
  };
}

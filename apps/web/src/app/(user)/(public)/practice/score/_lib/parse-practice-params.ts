import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";

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
  const allowedRanges: ("non_mangan" | "mangan_plus")[] = [];
  const rangesValues = params.getAll("ranges");

  if (rangesValues.length > 0) {
    if (rangesValues.includes("non")) allowedRanges.push("non_mangan");
    if (rangesValues.includes("plus")) allowedRanges.push("mangan_plus");
  } else {
    allowedRanges.push("non_mangan", "mangan_plus");
  }

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

import type {
  Role,
  ScoreTableGeneratorOptions,
  ScoreRange,
  WinType,
} from "@mahjong-scoring/core";

import {
  RANGE_PARAM,
  RANGE_TOKEN_MANGAN_PLUS,
  RANGE_TOKEN_NON_MANGAN,
  parseRangeValues,
} from "../../_lib/range-params";
import {
  ROLE_PARAM,
  ROLE_TOKEN_KO,
  ROLE_TOKEN_OYA,
  parseRoleValues,
} from "../../_lib/role-params";

/**
 * 点数表早引きの出題絞り込み選択
 * 点数表出題選択
 */
export interface ScoreTableSelection {
  readonly includeOya: boolean;
  readonly includeKo: boolean;
  readonly includeTsumo: boolean;
  readonly includeRon: boolean;
  readonly includeNonMangan: boolean;
  readonly includeManganPlus: boolean;
}

/** ツモ/ロンを指定するクエリパラメータ名 */
export const WIN_PARAM = "wins";

/** すべての軸を含む既定選択 */
export const FULL_SELECTION: ScoreTableSelection = {
  includeOya: true,
  includeKo: true,
  includeTsumo: true,
  includeRon: true,
  includeNonMangan: true,
  includeManganPlus: true,
};

/** Next.js の searchParams で受け取りうる値の型 */
type SearchParamValue = string | string[] | undefined;

/** 出題条件を読み取る元になる searchParams 相当のオブジェクト */
export type RawSearchParams = Record<string, SearchParamValue>;

/**
 * `URLSearchParams`（`useSearchParams()` の戻り値など）を searchParams 相当へ変換する
 * URL 条件の読み出し
 *
 * 同名パラメータの複数指定（`roles=oya&roles=ko`）を配列のまま保つため、
 * `Object.fromEntries` ではなく `getAll` で読む。
 */
export function readSelectionParams(
  params: Pick<URLSearchParams, "getAll">,
): RawSearchParams {
  return {
    [ROLE_PARAM]: params.getAll(ROLE_PARAM),
    [WIN_PARAM]: params.getAll(WIN_PARAM),
    [RANGE_PARAM]: params.getAll(RANGE_PARAM),
  };
}

function valuesOf(raw: SearchParamValue): readonly string[] {
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * searchParams が出題条件を1つでも指定しているか
 * 条件指定の有無
 */
export function hasSelectionParams(params: RawSearchParams): boolean {
  return (
    valuesOf(params[ROLE_PARAM]).length > 0 ||
    valuesOf(params[WIN_PARAM]).length > 0 ||
    valuesOf(params[RANGE_PARAM]).length > 0
  );
}

/**
 * searchParams を出題選択へ変換する
 * 出題選択への変換
 *
 * 各軸はパラメータが無ければ「全部含む」とみなす（例: ガイドから `roles=ko` のみ
 * 指定された場合、wins と ranges は全選択になる）。指定があればその値のみ。
 */
export function searchParamsToSelection(
  params: RawSearchParams,
): ScoreTableSelection {
  const roles = parseRoleValues(valuesOf(params[ROLE_PARAM]));
  const wins = valuesOf(params[WIN_PARAM]);
  const ranges = parseRangeValues(valuesOf(params[RANGE_PARAM]));

  return {
    includeOya: roles.includeOya,
    includeKo: roles.includeKo,
    includeTsumo: wins.length === 0 || wins.includes("tsumo"),
    includeRon: wins.length === 0 || wins.includes("ron"),
    includeNonMangan: ranges.includeNonMangan,
    includeManganPlus: ranges.includeManganPlus,
  };
}

/**
 * 出題選択をジェネレータオプションへ変換する
 * ジェネレータオプション変換
 */
export function selectionToGeneratorOptions(
  selection: ScoreTableSelection,
): ScoreTableGeneratorOptions {
  const roles: Role[] = [];
  if (selection.includeOya) roles.push("oya");
  if (selection.includeKo) roles.push("ko");

  const wins: WinType[] = [];
  if (selection.includeTsumo) wins.push("tsumo");
  if (selection.includeRon) wins.push("ron");

  const ranges: ScoreRange[] = [];
  if (selection.includeNonMangan) ranges.push("nonMangan");
  if (selection.includeManganPlus) ranges.push("manganPlus");

  return { roles, wins, ranges };
}

/**
 * 出題選択を play/training への遷移用クエリ文字列へ変換する
 * クエリ文字列生成
 *
 * 全選択の軸はパラメータを省略してURLを短く保つ（受け取り側は欠落=全選択と解釈）。
 */
export function selectionToQueryString(selection: ScoreTableSelection): string {
  const params = new URLSearchParams();

  if (!(selection.includeOya && selection.includeKo)) {
    if (selection.includeOya) params.append(ROLE_PARAM, ROLE_TOKEN_OYA);
    if (selection.includeKo) params.append(ROLE_PARAM, ROLE_TOKEN_KO);
  }
  if (!(selection.includeTsumo && selection.includeRon)) {
    if (selection.includeTsumo) params.append(WIN_PARAM, "tsumo");
    if (selection.includeRon) params.append(WIN_PARAM, "ron");
  }
  if (!(selection.includeNonMangan && selection.includeManganPlus)) {
    if (selection.includeNonMangan)
      params.append(RANGE_PARAM, RANGE_TOKEN_NON_MANGAN);
    if (selection.includeManganPlus)
      params.append(RANGE_PARAM, RANGE_TOKEN_MANGAN_PLUS);
  }

  return params.toString();
}

/**
 * 出題条件付きの点数表早引きへのリンクを組み立てる
 * 点数表練習リンク
 *
 * 教本から「子・ロン・満貫以上だけ」のように絞って遷移するときに使う。
 * 省略した軸は全選択（= パラメータを出さない）。受け取り側は未知のトークンを
 * 黙って無視して全選択に劣化させるため、URL の語彙をここ以外で組み立てないこと。
 */
export function scoreTablePracticeHref(picks: {
  readonly roles?: readonly Role[];
  readonly wins?: readonly WinType[];
  readonly ranges?: readonly ScoreRange[];
}): string {
  const { roles, wins, ranges } = picks;
  const query = selectionToQueryString({
    includeOya: roles === undefined || roles.includes("oya"),
    includeKo: roles === undefined || roles.includes("ko"),
    includeTsumo: wins === undefined || wins.includes("tsumo"),
    includeRon: wins === undefined || wins.includes("ron"),
    includeNonMangan: ranges === undefined || ranges.includes("nonMangan"),
    includeManganPlus: ranges === undefined || ranges.includes("manganPlus"),
  });

  return query === ""
    ? "/practice/score-table"
    : `/practice/score-table?${query}`;
}

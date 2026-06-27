import type {
  ScoreTableGeneratorOptions,
  ScoreTableRange,
} from "@mahjong-scoring/core";

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
type RawSearchParams = Record<string, SearchParamValue>;

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
    valuesOf(params.roles).length > 0 ||
    valuesOf(params.wins).length > 0 ||
    valuesOf(params.ranges).length > 0
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
  const roles = valuesOf(params.roles);
  const wins = valuesOf(params.wins);
  const ranges = valuesOf(params.ranges);

  return {
    includeOya: roles.length === 0 || roles.includes("oya"),
    includeKo: roles.length === 0 || roles.includes("ko"),
    includeTsumo: wins.length === 0 || wins.includes("tsumo"),
    includeRon: wins.length === 0 || wins.includes("ron"),
    includeNonMangan: ranges.length === 0 || ranges.includes("non"),
    includeManganPlus: ranges.length === 0 || ranges.includes("plus"),
  };
}

/**
 * 出題選択をジェネレータオプションへ変換する
 * ジェネレータオプション変換
 */
export function selectionToGeneratorOptions(
  selection: ScoreTableSelection,
): ScoreTableGeneratorOptions {
  const roles: ("oya" | "ko")[] = [];
  if (selection.includeOya) roles.push("oya");
  if (selection.includeKo) roles.push("ko");

  const wins: ("tsumo" | "ron")[] = [];
  if (selection.includeTsumo) wins.push("tsumo");
  if (selection.includeRon) wins.push("ron");

  const ranges: ScoreTableRange[] = [];
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
    if (selection.includeOya) params.append("roles", "oya");
    if (selection.includeKo) params.append("roles", "ko");
  }
  if (!(selection.includeTsumo && selection.includeRon)) {
    if (selection.includeTsumo) params.append("wins", "tsumo");
    if (selection.includeRon) params.append("wins", "ron");
  }
  if (!(selection.includeNonMangan && selection.includeManganPlus)) {
    if (selection.includeNonMangan) params.append("ranges", "non");
    if (selection.includeManganPlus) params.append("ranges", "plus");
  }

  return params.toString();
}

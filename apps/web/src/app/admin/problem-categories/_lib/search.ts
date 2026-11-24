import { ARCHIVE_KINDS, FU_VALUES } from "@mahjong-scoring/core";
import {
  PROBLEM_VALUE_CATEGORIES,
  type FacetCondition,
} from "@mahjong-scoring/features/problem-facets/categories";
import { z } from "zod";

/** 検索フォームの複数選択軸。値と表示名は単一値分類のレジストリから引く。 */
export const SEARCH_CATEGORY_GROUPS = ["yaku", "machi", "level"] as const;

/** 検索フォームの単一入力。空文字は指定なし。 */
export const SEARCH_SCALAR_FIELDS = [
  "fuMin",
  "fuMax",
  "hanEq",
  "hanMin",
  "hanMax",
  "yakuMode",
  "agari",
  "menzen",
  "kind",
] as const;

/** 検索フォームの複数入力。GET では同名のパラメータを繰り返す。 */
export const SEARCH_ARRAY_FIELDS = ["fu", ...SEARCH_CATEGORY_GROUPS] as const;

/** 検索フォームの入力値。エラー時も入力を残すため数値は文字列で持つ。 */
export type ProblemSearchFields = Readonly<
  Record<(typeof SEARCH_SCALAR_FIELDS)[number], string>
> &
  Readonly<Record<(typeof SEARCH_ARRAY_FIELDS)[number], readonly string[]>>;

/** URL の生の検索パラメータ。単一入力への重複値も検証対象にする。 */
export type ProblemSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

/** 検証済みの自由検索。種別は問題の属性、condition は同じ和了の属性に当てる。 */
export interface ProblemSearch {
  readonly condition: FacetCondition;
  readonly kind?: (typeof ARCHIVE_KINDS)[number];
}

/** 表示用の検索エラー。文言は管理画面の辞書に置く。 */
export interface ProblemSearchError {
  readonly field: string;
  readonly message: "invalid" | "range" | "exclusive" | "conflict";
}

/** 入力を残し、失敗した検索は実行可能な条件を返さない。 */
export interface ProblemSearchState {
  readonly active: boolean;
  readonly fields: ProblemSearchFields;
  readonly errors: readonly ProblemSearchError[];
  readonly query?: ProblemSearch;
}

const fuStrings = FU_VALUES.map(String);
const scalar = z.string().trim().max(32).default("");
const numberText = scalar.refine(
  (value) =>
    value === "" ||
    (/^[0-9]+$/.test(value) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) >= 1 &&
      Number(value) <= 2147483647),
);
const fuText = scalar.refine(
  (value) => value === "" || fuStrings.includes(value),
);
const selection = (values: readonly string[]) =>
  scalar.refine((value) => value === "" || values.includes(value));
const multiple = (values: readonly string[]) =>
  z.preprocess(
    (value) => (typeof value === "string" ? [value] : value),
    z
      .array(z.string().refine((value) => values.includes(value)))
      .max(100)
      .default([]),
  );
const categoryIds = (group: (typeof SEARCH_CATEGORY_GROUPS)[number]) =>
  PROBLEM_VALUE_CATEGORIES.filter((category) => category.group === group).map(
    ({ id }) => id,
  );
const schema = z.object({
  fu: multiple(fuStrings),
  fuMin: fuText,
  fuMax: fuText,
  hanEq: numberText,
  hanMin: numberText,
  hanMax: numberText,
  yaku: multiple(categoryIds("yaku")),
  yakuMode: selection(["any", "all"]),
  machi: multiple(categoryIds("machi")),
  level: multiple(categoryIds("level")),
  agari: selection(["tsumo", "ron"]),
  menzen: selection(["true", "false"]),
  kind: z.enum(["", ...ARCHIVE_KINDS]).default(""),
  search: z.literal("1").optional(),
});

function scalarValue(params: ProblemSearchParams, field: string): string {
  const value = params[field];
  return typeof value === "string" ? value : (value?.[0] ?? "");
}
function arrayValue(
  params: ProblemSearchParams,
  field: string,
): readonly string[] {
  const value = params[field];
  return typeof value === "string" ? [value] : (value ?? []);
}
function fieldsOf(params: ProblemSearchParams): ProblemSearchFields {
  return {
    fu: arrayValue(params, "fu"),
    fuMin: scalarValue(params, "fuMin"),
    fuMax: scalarValue(params, "fuMax"),
    hanEq: scalarValue(params, "hanEq"),
    hanMin: scalarValue(params, "hanMin"),
    hanMax: scalarValue(params, "hanMax"),
    yaku: arrayValue(params, "yaku"),
    yakuMode: scalarValue(params, "yakuMode"),
    machi: arrayValue(params, "machi"),
    level: arrayValue(params, "level"),
    agari: scalarValue(params, "agari"),
    menzen: scalarValue(params, "menzen"),
    kind: scalarValue(params, "kind"),
  };
}
const optionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

/**
 * 管理画面の検索 URL を検証し、同じ和了に対する条件へ変換する。
 * 問題検索条件解析
 *
 * @design 不正値を無視して検索結果を広げない
 * 値の複数選択と範囲、翻の一致と範囲は排他。重複した単一入力や未知の選択値もエラー。
 * category / flag と検索が混在した URL はどれかを優先せず、競合として検索しない。
 * 検索ボタンで search=1 を付けるので、条件なしの全件検索と未検索を区別できる。
 *
 * @design 役牌を含む「すべて」は内訳の OR と通常役の AND
 * 例えば役牌 + 一通は (白 OR 場風 OR 自風 …) AND 一通。同じ和了で満たす必要がある。
 * 内訳の全 ID を yakuAll に入れる案は採らない。役の正規化は分類レジストリを正本にする。
 */
export function parseProblemSearch(
  params: ProblemSearchParams,
): ProblemSearchState {
  const fields = fieldsOf(params);
  const active = [
    "search",
    ...SEARCH_SCALAR_FIELDS,
    ...SEARCH_ARRAY_FIELDS,
  ].some((key) => params[key] !== undefined);
  if (!active) return { active, fields, errors: [] };
  if (params.category !== undefined || params.flag !== undefined) {
    return {
      active,
      fields,
      errors: [{ field: "search", message: "conflict" }],
    };
  }
  const parsed = schema.safeParse(params);
  if (!parsed.success)
    return {
      active,
      fields,
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0]),
        message: "invalid",
      })),
    };
  const data = parsed.data;
  const errors: ProblemSearchError[] = [];
  if (data.fu.length && (data.fuMin || data.fuMax))
    errors.push({ field: "fu", message: "exclusive" });
  if (data.hanEq && (data.hanMin || data.hanMax))
    errors.push({ field: "hanEq", message: "exclusive" });
  if (data.fuMin && data.fuMax && Number(data.fuMin) > Number(data.fuMax))
    errors.push({ field: "fuMin", message: "range" });
  if (data.hanMin && data.hanMax && Number(data.hanMin) > Number(data.hanMax))
    errors.push({ field: "hanMin", message: "range" });
  if (errors.length) return { active, fields, errors };
  const selected = PROBLEM_VALUE_CATEGORIES.filter(({ id }) =>
    data.yaku.includes(id),
  );
  const allYakuIds = selected.flatMap(({ condition }) => [
    ...(condition.yakuAll ?? []),
    ...(condition.yakuAny ?? []),
  ]);
  const exactYakuIds = selected.flatMap(
    ({ condition }) => condition.yakuAll ?? [],
  );
  const yakuhaiIds = selected.flatMap(
    ({ condition }) => condition.yakuAny ?? [],
  );
  const yakuAny = data.yakuMode === "all" ? yakuhaiIds : allYakuIds;
  const machiIn = PROBLEM_VALUE_CATEGORIES.filter(({ id }) =>
    data.machi.includes(id),
  ).flatMap(({ condition }) => condition.machiIn ?? []);
  const scoreLevelIn = PROBLEM_VALUE_CATEGORIES.filter(({ id }) =>
    data.level.includes(id),
  ).flatMap(({ condition }) => condition.scoreLevelIn ?? []);
  return {
    active,
    fields: data,
    errors: [],
    query: {
      kind: data.kind || undefined,
      condition: {
        fuIn: data.fu.length ? data.fu.map(Number) : undefined,
        fuMin: optionalNumber(data.fuMin),
        fuMax: optionalNumber(data.fuMax),
        hanEq: optionalNumber(data.hanEq),
        hanMin: optionalNumber(data.hanMin),
        hanMax: optionalNumber(data.hanMax),
        yakuAll:
          data.yakuMode === "all" && exactYakuIds.length
            ? exactYakuIds
            : undefined,
        yakuAny: yakuAny.length ? yakuAny : undefined,
        machiIn: machiIn.length ? machiIn : undefined,
        scoreLevelIn: scoreLevelIn.length ? scoreLevelIn : undefined,
        isTsumo: data.agari === "" ? undefined : data.agari === "tsumo",
        isMenzen: data.menzen === "" ? undefined : data.menzen === "true",
      },
    },
  };
}

/** 検索条件を GET のクエリへ戻す。分類・印・ページ番号は含めず、ページ送りの基点にする。 */
export function problemSearchQuery(fields: ProblemSearchFields): string {
  const params = new URLSearchParams({ search: "1" });
  for (const field of SEARCH_SCALAR_FIELDS)
    if (fields[field] !== "") params.set(field, fields[field]);
  for (const field of SEARCH_ARRAY_FIELDS)
    for (const value of new Set(fields[field])) params.append(field, value);
  return params.toString();
}

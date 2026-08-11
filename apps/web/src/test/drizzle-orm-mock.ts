import { vi } from "vitest";

/**
 * drizzle-orm の演算子のテスト用スタブ
 * Drizzle演算子モック
 *
 * クエリの検証では「どの演算子がどの引数で呼ばれたか」だけが分かればよく、
 * 戻り値は識別できる形であれば何でもよい。各テストが独自の sentinel を
 * 作ると形が揃わないため、`{ op, args }` に統一する。
 *
 * `sql` はテンプレートリテラルとして呼ばれるうえ `sql.raw()` も持つため、
 * 呼び出し可能オブジェクトとして再現する。
 *
 * このモジュールはテスト専用。
 */

/** 演算子の呼び出しを表す sentinel */
export interface OperatorCall {
  readonly op: string;
  readonly args: readonly unknown[];
}

function operator(op: string) {
  return vi.fn((...args: unknown[]): OperatorCall => ({ op, args }));
}

export const and = operator("and");
export const or = operator("or");
export const eq = operator("eq");
export const gte = operator("gte");
export const lte = operator("lte");
export const asc = operator("asc");
export const desc = operator("desc");
export const inArray = operator("inArray");

export const sql = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => ({
    op: "sql",
    strings,
    values,
  }),
  { raw: (s: string) => s },
);

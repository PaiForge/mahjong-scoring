/** フィールドに期待する型 */
type FieldType = "string" | "number" | "boolean";

/**
 * 値がプロパティを引けるオブジェクトかを判定する
 * オブジェクト判定
 *
 * `typeof null === "object"` を除くだけの素朴な判定。配列も通す。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * 値がオブジェクトで、指定した各フィールドが期待どおりの型かを判定する
 * フィールド型判定
 *
 * sessionStorage から復元した値は型が保証されないため、結果ページで使う前に
 * 形を検証する。その「オブジェクトか確かめてからフィールドを 1 つずつ
 * typeof で見る」手順を各練習の型ガードで書き写さずに済ませる。
 *
 * 任意フィールドや列挙値のように単純な typeof で表せない条件は、呼び出し側で
 * この判定に続けて書くこと。
 *
 * @param fields - フィールド名から期待する型への対応
 */
export function hasFieldTypes(
  value: unknown,
  fields: Readonly<Record<string, FieldType>>,
): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return Object.entries(fields).every(
    ([key, type]) => typeof Reflect.get(value, key) === type,
  );
}

/**
 * 値が文字列の配列かを判定する
 * 文字列配列判定
 *
 * `hasFieldTypes` は typeof で表せる型しか見ないため、配列のフィールドは
 * これを続けて呼ぶ。
 */
export function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

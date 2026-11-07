/**
 * 親子絞り込みの URL パラメータ規約
 * 親子パラメータ
 *
 * 「親 / 子」は core の `Role` が唯一の型で、URL 上もその値をそのまま
 * トークンに使う（"oya" / "ko"）。その語彙とここでの解釈が唯一の定義で、
 * 各練習は結果を自分のジェネレータオプションへ組み立てる。
 */

import type { Role } from "@mahjong-scoring/core";

/** 親子を指定するクエリパラメータ名 */
export const ROLE_PARAM = "roles";

/** 親を表す URL トークン */
export const ROLE_TOKEN_OYA: Role = "oya";

/** 子を表す URL トークン */
export const ROLE_TOKEN_KO: Role = "ko";

/** 親子の絞り込み結果 */
export interface RoleSelection {
  readonly includeOya: boolean;
  readonly includeKo: boolean;
}

/**
 * `roles` の値から親子の絞り込みを解釈する
 * 親子解釈
 *
 * 指定が1つも無ければ「全部含む」とみなす（ガイドからの遷移で
 * 一部の軸だけ指定されるケースを全選択として扱うため）。
 */
export function parseRoleValues(values: readonly string[]): RoleSelection {
  if (values.length === 0) {
    return { includeOya: true, includeKo: true };
  }
  return {
    includeOya: values.includes(ROLE_TOKEN_OYA),
    includeKo: values.includes(ROLE_TOKEN_KO),
  };
}

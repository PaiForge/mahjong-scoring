import { sql, type SQL } from "drizzle-orm";

import { practiceProblemFacets } from "@/lib/db";
import { existsFacetRow } from "@/lib/practice-problems/facet-condition-sql";

/**
 * ルールで変わる印（属性の行の `varies_by_*`）の一覧
 *
 * URL のクエリ（`?flag=`）と辞書キー（`admin.problemCategories.flags.<flag>`）に
 * 同じ文字列を使う。
 */
export const RULE_FLAGS = ["renfonpai", "kiriage", "yakumanRules"] as const;

/**
 * ルールで変わる印
 * ルール依存フラグ
 */
export type RuleFlag = (typeof RULE_FLAGS)[number];

const FLAG_COLUMNS = {
  renfonpai: practiceProblemFacets.variesByRenfonpai,
  kiriage: practiceProblemFacets.variesByKiriage,
  yakumanRules: practiceProblemFacets.variesByYakumanRules,
} as const;

/**
 * 印の立つ和了を 1 つでも持つ問題、という SQL（親の行に対する条件）
 * ルール依存条件
 *
 * 分類と同じく EXISTS で見て、和了の数だけ問題を増やさない。
 */
export function ruleFlagCondition(flag: RuleFlag): SQL {
  return existsFacetRow(sql`${FLAG_COLUMNS[flag]} IS TRUE`);
}

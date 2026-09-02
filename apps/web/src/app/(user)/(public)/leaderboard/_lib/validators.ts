import type { LeaderboardModule, LeaderboardPeriod } from "./types";
import { MODULES, VALID_PERIODS } from "./types";

const validPeriodSet: ReadonlySet<string> = new Set(VALID_PERIODS);

const validModuleSet: ReadonlySet<string> = new Set(MODULES);

/**
 * 期間値のバリデーション
 * 有効な期間値か判定する型ガード
 */
export function isValidPeriod(value: string): value is LeaderboardPeriod {
  return validPeriodSet.has(value);
}

/**
 * モジュール値のバリデーション
 * 有効なモジュール値か判定する型ガード
 *
 * 練習種別として存在するかではなく、{@link MODULES}（ランキングを持つ練習）
 * に含まれるかを見る。レジストリ全件を通すと、一覧から外した昇級試験の
 * 詳細ページが直 URL で開けたままになる。
 */
export function isValidModule(value: string): value is LeaderboardModule {
  return validModuleSet.has(value);
}

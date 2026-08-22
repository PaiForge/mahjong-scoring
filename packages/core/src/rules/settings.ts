/**
 * 麻雀ルールの差分設定
 *
 * 標準ルールからの差分のみを保持する。保存方法（localStorage 等）は
 * この層では関知せず、利用側が値を生成して各種ジェネレータへ渡す。
 * ルール設定
 */
export interface RuleSettings {
  /**
   * 連風牌（場風＝自風）の雀頭を4符として扱うかどうか。
   *
   * - false: 通常の役牌と同じく2符（デフォルト）
   * - true: 場風2符＋自風2符として4符
   */
  readonly renfonpaiAs4Fu: boolean;
}

/**
 * ルール設定のデフォルト値（標準ルール）
 * 既定ルール設定
 */
export const DEFAULT_RULE_SETTINGS: RuleSettings = {
  renfonpaiAs4Fu: false,
};

/**
 * 連風牌の雀頭が何符になるかをルール設定から導く
 * 連風牌雀頭符
 *
 * 「連風牌雀頭を4符とするか」というルールの唯一の定義。ライブラリへ渡す
 * `ruleConfig.doubleWindJantouFu` も、自前で符を積む経路もここを通すこと。
 */
export function doubleWindJantouFu(renfonpaiAs4Fu: boolean): 2 | 4 {
  return renfonpaiAs4Fu ? 4 : 2;
}

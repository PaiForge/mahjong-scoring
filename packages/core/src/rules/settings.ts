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

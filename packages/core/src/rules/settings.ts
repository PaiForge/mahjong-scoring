import type { YakumanRuleConfig } from "@pai-forge/riichi-mahjong";

/**
 * 麻雀ルールの差分設定
 *
 * 標準ルールからの差分のみを保持する。保存方法（localStorage 等）は
 * この層では関知せず、利用側が値を生成して各種ジェネレータへ渡す。
 * ルール設定
 *
 * ダブル役満系のフラグをネストさせずフラットに持つのは、永続化層
 * （zustand persist の浅いマージ）が欠損キーを既定値で補完できる形を
 * 保つため。ライブラリへ渡す形への変換は {@link toYakumanRuleConfig} が担う。
 */
export interface RuleSettings {
  /**
   * 連風牌（場風＝自風）の雀頭を4符として扱うかどうか。
   *
   * - false: 通常の役牌と同じく2符（デフォルト）
   * - true: 場風2符＋自風2符として4符
   */
  readonly renfonpaiAs4Fu: boolean;

  /**
   * 30符4翻・60符3翻のアガリを満貫に切り上げるかどうか（切り上げ満貫）。
   *
   * - false: 切り上げない（子7700点・親11600点、デフォルト）
   * - true: 満貫に切り上げる（子8000点・親12000点）
   */
  readonly kiriageMangan: boolean;

  /** 四暗刻の単騎待ちをダブル役満とするか（既定 false） */
  readonly suuankouTankiDouble: boolean;

  /** 大四喜をダブル役満とするか（既定 false） */
  readonly daisuushiiDouble: boolean;

  /** 国士無双の十三面待ちをダブル役満とするか（既定 false） */
  readonly kokushiJuusanmenDouble: boolean;

  /** 純正九蓮宝燈（九面待ち）をダブル役満とするか（既定 false） */
  readonly junseiChuurenDouble: boolean;

  /**
   * 複数役満の複合を合算するか（既定 false）。
   *
   * - false: 複合しても支払いは最高位の役満1つ分
   * - true: 役満単位（役満=1・ダブル役満=2）の合計分を支払う
   */
  readonly fukugouYakuman: boolean;
}

/**
 * ルール設定のデフォルト値（標準ルール）
 * 既定ルール設定
 */
export const DEFAULT_RULE_SETTINGS: RuleSettings = {
  renfonpaiAs4Fu: false,
  kiriageMangan: false,
  suuankouTankiDouble: false,
  daisuushiiDouble: false,
  kokushiJuusanmenDouble: false,
  junseiChuurenDouble: false,
  fukugouYakuman: false,
};

/**
 * ルール設定のうちダブル役満・複合役満に関わる部分
 * 役満ルール設定部分
 */
export type YakumanRuleSettings = Pick<
  RuleSettings,
  | "suuankouTankiDouble"
  | "daisuushiiDouble"
  | "kokushiJuusanmenDouble"
  | "junseiChuurenDouble"
  | "fukugouYakuman"
>;

/**
 * ルール設定からライブラリへ渡す役満ルール設定を組み立てる
 * 役満ルール設定変換
 *
 * アプリの設定とライブラリの `YakumanRuleConfig` の対応関係の唯一の定義。
 * 生成・判定・表示のどの経路もこの変換を通すこと。
 */
export function toYakumanRuleConfig(
  settings: Readonly<YakumanRuleSettings>,
): YakumanRuleConfig {
  return {
    suuankouTanki: settings.suuankouTankiDouble,
    daisuushii: settings.daisuushiiDouble,
    kokushiMusouJuusanmen: settings.kokushiJuusanmenDouble,
    junseiChuurenPoutou: settings.junseiChuurenDouble,
    fukugouYakuman: settings.fukugouYakuman,
  };
}

/**
 * 役満ルールをすべて有効にした設定
 * 役満ルール全有効
 *
 * 「ルール設定の採否で正解が割れる手」の検出に使う（全無効との比較で
 * 点数が変わる手 = 境界の手）。出題から境界を外したい生成
 * （`excludeYakumanRuleBoundary`）と、そのテストが参照する。
 */
export const ALL_YAKUMAN_RULES_ENABLED: YakumanRuleConfig = {
  suuankouTanki: true,
  daisuushii: true,
  kokushiMusouJuusanmen: true,
  junseiChuurenPoutou: true,
  fukugouYakuman: true,
};

/**
 * ダブル役満（26翻以上の正解）が出題されうるルール設定かどうか
 * ダブル役満許容判定
 *
 * 翻数の表示・判定を役満（13翻）へ丸めるか、点数選択肢にダブル役満を
 * 含めるかの分岐はこれを通す。フラグを1つでも有効にすると 26 翻以上の
 * 正解が現れうる。
 */
export function allowsDoubleYakuman(
  config: Readonly<YakumanRuleConfig> | undefined,
): boolean {
  if (!config) return false;
  return (
    config.suuankouTanki === true ||
    config.daisuushii === true ||
    config.kokushiMusouJuusanmen === true ||
    config.junseiChuurenPoutou === true ||
    config.fukugouYakuman === true
  );
}

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

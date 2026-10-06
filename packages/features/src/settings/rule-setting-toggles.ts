import type { RuleSettings } from "@mahjong-scoring/core";
import type { RuleSettingsState } from "./use-rule-settings-store";

/** ルール設定のうちトグルで切り替える項目 */
type RuleSettingSetter = {
  [K in keyof RuleSettingsState]: RuleSettingsState[K] extends (
    enabled: boolean,
  ) => void
    ? K
    : never;
}[keyof RuleSettingsState];

/**
 * ルール設定のトグル 1 行
 * ルール設定トグル
 */
export interface RuleSettingToggle {
  /** ストアの値 */
  readonly field: keyof RuleSettings;
  /** ストアの更新関数 */
  readonly setter: RuleSettingSetter;
  /** 辞書キーの接頭辞（`settings.<messageKey>Title` / `Description`） */
  readonly messageKey: string;
}

/**
 * 設定画面に並べるルール設定のトグル（表示順）
 * ルール設定トグル一覧
 *
 * 連風牌・切り上げ満貫のあとに、ダブル役満と複合役満の採否を並べる。
 * web とモバイルの設定画面が同じ項目を同じ順で出すためにここに置く。
 */
export const RULE_SETTING_TOGGLES: readonly RuleSettingToggle[] = [
  {
    field: "renfonpaiAs4Fu",
    setter: "setRenfonpaiAs4Fu",
    messageKey: "renfonpai",
  },
  {
    field: "kiriageMangan",
    setter: "setKiriageMangan",
    messageKey: "kiriageMangan",
  },
  {
    field: "suuankouTankiDouble",
    setter: "setSuuankouTankiDouble",
    messageKey: "suuankouTankiDouble",
  },
  {
    field: "daisuushiiDouble",
    setter: "setDaisuushiiDouble",
    messageKey: "daisuushiiDouble",
  },
  {
    field: "kokushiJuusanmenDouble",
    setter: "setKokushiJuusanmenDouble",
    messageKey: "kokushiJuusanmenDouble",
  },
  {
    field: "junseiChuurenDouble",
    setter: "setJunseiChuurenDouble",
    messageKey: "junseiChuurenDouble",
  },
  {
    field: "fukugouYakuman",
    setter: "setFukugouYakuman",
    messageKey: "fukugouYakuman",
  },
];

import { createRuleSettingsStore } from "@mahjong-scoring/features/settings/use-rule-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 麻雀ルール設定ストア（web・localStorage に永続化）
 * ルール設定ストア
 *
 * 項目・既定値・保存名と派生フック（`useYakumanRules`）は features の
 * `createRuleSettingsStore` が持つ。
 */
export const { useRuleSettingsStore, useYakumanRules } =
  createRuleSettingsStore(WEB_SETTINGS_STORE_OPTIONS);

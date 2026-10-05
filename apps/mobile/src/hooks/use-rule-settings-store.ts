import { createRuleSettingsStore } from "@mahjong-scoring/features/settings/use-rule-settings-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/** 麻雀ルール設定ストア（モバイル・AsyncStorage に永続化） */
export const { useRuleSettingsStore, useYakumanRules } =
  createRuleSettingsStore(MOBILE_SETTINGS_STORE_OPTIONS);

import { createYakuOrderStore } from "@mahjong-scoring/features/settings/use-yaku-order-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/** 役の並び設定ストア（モバイル・AsyncStorage に永続化） */
export const { useYakuOrderStore, useYakuOrder } = createYakuOrderStore(
  MOBILE_SETTINGS_STORE_OPTIONS,
);

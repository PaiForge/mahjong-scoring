import { createPracticeVariantStore } from "@mahjong-scoring/features/settings/use-practice-variant-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/** 前回の出題設定ストア（モバイル・AsyncStorage に永続化） */
export const { usePracticeVariantStore, useRememberedPracticeVariant } =
  createPracticeVariantStore(MOBILE_SETTINGS_STORE_OPTIONS);

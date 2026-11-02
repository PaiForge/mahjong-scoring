import { createPracticeVariantStore } from "@mahjong-scoring/features/settings/use-practice-variant-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 前回の出題設定ストア（web・localStorage に永続化）
 * 前回出題設定ストア
 *
 * 項目・保存名と派生フック（`useRememberedPracticeVariant`）は features の
 * `createPracticeVariantStore` が持つ。
 */
export const { usePracticeVariantStore, useRememberedPracticeVariant } =
  createPracticeVariantStore(WEB_SETTINGS_STORE_OPTIONS);

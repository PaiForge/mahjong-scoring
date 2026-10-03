import { createYakuOrderStore } from "@mahjong-scoring/features/settings/use-yaku-order-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 役の並び順ストア（web・localStorage に永続化）
 * 役並び順ストア
 *
 * 項目・保存名と派生フック（`useYakuOrder`）は features の
 * `createYakuOrderStore` が持つ。
 */
export const { useYakuOrderStore, useYakuOrder } = createYakuOrderStore(
  WEB_SETTINGS_STORE_OPTIONS,
);

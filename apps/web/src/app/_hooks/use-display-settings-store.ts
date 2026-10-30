import { createDisplaySettingsStore } from "@mahjong-scoring/features/settings/use-display-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 表示設定ストア（web・localStorage に永続化）
 * 表示設定ストア
 *
 * 項目・既定値・保存名と派生フック（ドラ表示・用語リンク・符翻の順・子ツモの入力方式・点数の入力方式・手牌の向きと並べ方・復元状態）は
 * features の `createDisplaySettingsStore` が持つ。
 */
export const {
  useDisplaySettingsStore,
  useDisplaySettingsHydration,
  useTileOrientationSetting,
  useTileOrderSetting,
  useDoraDisplayMode,
  useTermLinksEnabled,
  useFuHanOrder,
  useKoTsumoInput,
  useScoreInput,
} = createDisplaySettingsStore(WEB_SETTINGS_STORE_OPTIONS);

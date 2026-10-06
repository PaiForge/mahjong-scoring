import type { SettingsStoreOptions } from "@mahjong-scoring/features/settings/settings-store-options";

import { safeLocalStorage } from "@/lib/safe-storage";

import { useHydrated } from "./use-hydrated";

/**
 * web の端末ローカル設定ストアの生成オプション
 * web 設定ストアオプション
 *
 * 保存先は localStorage。永続値はストア生成時に同期で載るため、サーバーの
 * HTML（常に既定値）と初回クライアント描画がずれないよう、派生フックは
 * {@link useHydrated} でハイドレーション完了まで既定値を返す。
 *
 * 素の localStorage を渡すと、容量超過やプライベートモードで `setItem` が
 * 投げたとき zustand の `setState` ごと例外になり、設定を変えた操作が落ちる。
 * 例外を投げない版を渡し、読めなければ既定値・書けなければその場限りの設定に
 * なるようにする。
 */
export const WEB_SETTINGS_STORE_OPTIONS: SettingsStoreOptions = {
  storage: () => safeLocalStorage,
  useHydrated,
};

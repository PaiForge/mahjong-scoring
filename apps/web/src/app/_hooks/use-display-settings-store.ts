import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_DORA_DISPLAY_MODE,
  type DoraDisplayMode,
} from "@/app/_lib/dora-display";
import { useIsClient } from "./use-is-client";

interface DisplaySettingsState {
  /** ドラを表示牌のまま出すか、ドラそのものに読み替えて出すか */
  doraDisplay: DoraDisplayMode;
  setDoraDisplay: (mode: DoraDisplayMode) => void;
}

/**
 * 表示設定ストア（端末ローカル永続化）
 *
 * 出題内容や正解判定を変えず、見せ方だけを切り替える設定を保持する。
 * ルール差分（`useRuleSettingsStore`）とは別に持つのは、こちらが
 * 「麻雀のルール」ではなく「この画面での見え方」の選択だから。
 * 表示設定ストア
 */
export const useDisplaySettingsStore = create<DisplaySettingsState>()(
  persist(
    (set) => ({
      doraDisplay: DEFAULT_DORA_DISPLAY_MODE,
      setDoraDisplay: (doraDisplay) => set({ doraDisplay }),
    }),
    {
      // 既定の浅いマージ（永続値を初期state へ上書き）により、
      // 将来キーを追加しても欠損フィールドは既定値で補完される。
      name: "mahjong-display-settings",
    },
  ),
);

/**
 * ドラの表示モード取得フック
 *
 * ハイドレーション完了までは既定値を返す。永続値は localStorage から
 * ストア生成時に同期的に載るため、そのまま読むと SSR 済みの HTML
 * （＝常に既定値）と初回クライアントレンダーがずれる。
 * ドラ表示モード
 */
export function useDoraDisplayMode(): DoraDisplayMode {
  const isClient = useIsClient();
  const doraDisplay = useDisplaySettingsStore((s) => s.doraDisplay);
  return isClient ? doraDisplay : DEFAULT_DORA_DISPLAY_MODE;
}

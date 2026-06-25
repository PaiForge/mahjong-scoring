import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_RULE_SETTINGS,
  type RuleSettings,
} from "@mahjong-scoring/core";

interface RuleSettingsState extends RuleSettings {
  setRenfonpaiAs4Fu: (enabled: boolean) => void;
}

/**
 * 麻雀ルール設定ストア（端末ローカル永続化）
 *
 * 連風牌の符など、点数計算のローカルルール差分を保持する。
 * 練習機能横断で参照されるため、機能ローカルではなくアプリ共通に置く。
 * ルール設定ストア
 */
export const useRuleSettingsStore = create<RuleSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_RULE_SETTINGS,
      setRenfonpaiAs4Fu: (renfonpaiAs4Fu) => set({ renfonpaiAs4Fu }),
    }),
    {
      // 既定の浅いマージ（永続値を初期state へ上書き）により、
      // 将来キーを追加しても欠損フィールドは既定値で補完される。
      name: "mahjong-rule-settings",
    },
  ),
);

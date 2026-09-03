import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_RULE_SETTINGS,
  toYakumanRuleConfig,
  type RuleSettings,
  type YakumanRuleConfig,
} from "@mahjong-scoring/core";

interface RuleSettingsState extends RuleSettings {
  setRenfonpaiAs4Fu: (enabled: boolean) => void;
  setKiriageMangan: (enabled: boolean) => void;
  setSuuankouTankiDouble: (enabled: boolean) => void;
  setDaisuushiiDouble: (enabled: boolean) => void;
  setKokushiJuusanmenDouble: (enabled: boolean) => void;
  setJunseiChuurenDouble: (enabled: boolean) => void;
  setFukugouYakuman: (enabled: boolean) => void;
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
      setKiriageMangan: (kiriageMangan) => set({ kiriageMangan }),
      setSuuankouTankiDouble: (suuankouTankiDouble) =>
        set({ suuankouTankiDouble }),
      setDaisuushiiDouble: (daisuushiiDouble) => set({ daisuushiiDouble }),
      setKokushiJuusanmenDouble: (kokushiJuusanmenDouble) =>
        set({ kokushiJuusanmenDouble }),
      setJunseiChuurenDouble: (junseiChuurenDouble) =>
        set({ junseiChuurenDouble }),
      setFukugouYakuman: (fukugouYakuman) => set({ fukugouYakuman }),
    }),
    {
      // 既定の浅いマージ（永続値を初期state へ上書き）により、
      // 将来キーを追加しても欠損フィールドは既定値で補完される。
      name: "mahjong-rule-settings",
    },
  ),
);

/**
 * ライブラリへ渡す役満ルール設定（ダブル役満の形・複合役満の合算）
 * 役満ルール設定フック
 *
 * ストアのフラグから `toYakumanRuleConfig` で組み立てる。オブジェクトを
 * 生成するためセレクタでは返さず、個別フラグを購読して useMemo で束ねる
 * （毎レンダー新オブジェクトを返すと購読側が無限再レンダーになる）。
 * 出題オプション（`yakumanRules`）や選択肢の出し分け
 * （`allowsDoubleYakuman`）はこのフックの戻り値を使う。
 *
 * 昇級試験は端末ローカル設定に左右されてはならないため、これを使わない
 * （出題側の `excludeYakumanRuleBoundary` が境界の手ごと落とす）。
 */
export function useYakumanRules(): YakumanRuleConfig {
  const suuankouTankiDouble = useRuleSettingsStore(
    (s) => s.suuankouTankiDouble,
  );
  const daisuushiiDouble = useRuleSettingsStore((s) => s.daisuushiiDouble);
  const kokushiJuusanmenDouble = useRuleSettingsStore(
    (s) => s.kokushiJuusanmenDouble,
  );
  const junseiChuurenDouble = useRuleSettingsStore(
    (s) => s.junseiChuurenDouble,
  );
  const fukugouYakuman = useRuleSettingsStore((s) => s.fukugouYakuman);

  return useMemo(
    () =>
      toYakumanRuleConfig({
        suuankouTankiDouble,
        daisuushiiDouble,
        kokushiJuusanmenDouble,
        junseiChuurenDouble,
        fukugouYakuman,
      }),
    [
      suuankouTankiDouble,
      daisuushiiDouble,
      kokushiJuusanmenDouble,
      junseiChuurenDouble,
      fukugouYakuman,
    ],
  );
}

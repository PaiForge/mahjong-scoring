import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_RULE_SETTINGS,
  toYakumanRuleConfig,
  type RuleSettings,
  type YakumanRuleConfig,
} from "@mahjong-scoring/core";

import type { SettingsStoreOptions } from "./settings-store-options";

/** ルール設定ストアの状態と更新関数 */
export interface RuleSettingsState extends RuleSettings {
  setRenfonpaiAs4Fu: (enabled: boolean) => void;
  setKiriageMangan: (enabled: boolean) => void;
  setSuuankouTankiDouble: (enabled: boolean) => void;
  setDaisuushiiDouble: (enabled: boolean) => void;
  setKokushiJuusanmenDouble: (enabled: boolean) => void;
  setJunseiChuurenDouble: (enabled: boolean) => void;
  setFukugouYakuman: (enabled: boolean) => void;
}

/**
 * 麻雀ルール設定ストアを作る（端末ローカル永続化）
 * ルール設定ストア生成
 *
 * 連風牌の符など、点数計算のローカルルール差分を保持する。
 * 練習機能横断で参照されるため、機能ローカルではなくアプリ共通に置く。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること（呼ぶたびに別の
 * ストアができる）。
 *
 * 端末ごとの値なので記録の土俵（`leaderboard_key`）には載せない。記録が
 * 残るチャレンジは、設定の採否で正解が割れる手を出題から落とし、点数の
 * 選択肢を設定に依らない集合に固定することで設定から独立させる
 * （`challenge/rule-boundary.ts`）。昇級試験はそもそもこのストアを
 * 読まない。
 *
 * @param options 保存先（保存名は `mahjong-rule-settings` 固定）
 */
export function createRuleSettingsStore({ storage }: SettingsStoreOptions) {
  const useRuleSettingsStore = create<RuleSettingsState>()(
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
        storage: createJSONStorage(storage),
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
  function useYakumanRules(): YakumanRuleConfig {
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

  return { useRuleSettingsStore, useYakumanRules };
}

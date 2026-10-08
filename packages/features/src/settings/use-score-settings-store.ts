import type { ScoreRange } from "@mahjong-scoring/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SettingsStoreOptions } from "./settings-store-options";

/** 点数計算系の練習の設定（和了形の点数計算・聴牌形の点数計算で共通の項目） */
export interface ScoreSettingsState {
  /** 役も回答するかどうか */
  requireYaku: boolean;
  setRequireYaku: (enabled: boolean) => void;
  /** 5翻以上も翻数で回答するかどうか（既定では満貫・跳満…の区分で回答する） */
  exactHan: boolean;
  setExactHan: (enabled: boolean) => void;
  /** 満貫以上でも符を入力するかどうか */
  requireFuForMangan: boolean;
  setRequireFuForMangan: (enabled: boolean) => void;
  /** 出題する点数範囲 */
  targetScoreRanges: ScoreRange[];
  setTargetScoreRanges: (ranges: ScoreRange[]) => void;
  /** 出題する役（日本語役名、空 = 絞り込みなし） */
  targetYaku: string[];
  setTargetYaku: (yaku: string[]) => void;
  /**
   * 回答時間を計測するかどうか（Pro の拡張機能）。
   * 保存はするが、Pro でなければ設定画面が play へ渡さない
   */
  measureTime: boolean;
  setMeasureTime: (enabled: boolean) => void;
  /** 親を出題に含めるかどうか */
  includeParent: boolean;
  setIncludeParent: (enabled: boolean) => void;
  /** 子を出題に含めるかどうか */
  includeChild: boolean;
  setIncludeChild: (enabled: boolean) => void;
}

/**
 * 点数計算系の練習の設定ストアを作る（永続化あり）
 * 点数練習設定ストア生成
 *
 * 和了形の点数計算と聴牌形の点数計算は同じ設定項目を持つが、片方で変えた
 * 設定がもう片方に及ばないよう、練習ごとに別の保存名で持つ。
 *
 * @param name - 保存名（web では localStorage のキー）
 * @param options - 保存先
 */
export function createScoreSettingsStore(
  name: string,
  { storage }: SettingsStoreOptions,
) {
  return create<ScoreSettingsState>()(
    persist(
      (set) => ({
        requireYaku: false,
        setRequireYaku: (requireYaku) => set({ requireYaku }),
        exactHan: false,
        setExactHan: (exactHan) => set({ exactHan }),
        requireFuForMangan: false,
        setRequireFuForMangan: (requireFuForMangan) =>
          set({ requireFuForMangan }),
        targetScoreRanges: ["nonMangan", "manganPlus"],
        setTargetScoreRanges: (targetScoreRanges) => set({ targetScoreRanges }),
        targetYaku: [],
        setTargetYaku: (targetYaku) => set({ targetYaku }),
        measureTime: false,
        setMeasureTime: (measureTime) => set({ measureTime }),
        includeParent: true,
        setIncludeParent: (includeParent) => set({ includeParent }),
        includeChild: true,
        setIncludeChild: (includeChild) => set({ includeChild }),
      }),
      {
        name,
        storage: createJSONStorage(storage),
        // v0 は点数帯を snake_case（"non_mangan" / "mangan_plus"）で保存していた。
        // 型を core の ScoreRange（camelCase）へ統一したため、保存済みの値を
        // 変換する。変換しないと全チェックが外れ、練習を開始できなくなる。
        // v1 までは「正解時に自動で次へ」（`autoNext`）もここに持っていた。
        // トレーニング設定（`autoAdvanceOnCorrect`）と同じ意味の設定が練習ごとに
        // 別々に保存されていたため、トレーニング設定の 1 つに寄せて捨てる。
        version: 2,
        migrate: (persisted, version) => {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- zustand の migrate は保存値を unknown で受けて S を返す契約。保存するのは自分の partialize 済みの値なので形は信じ、旧版の項目だけ直す
          const state = persisted as ScoreSettingsState & {
            autoNext?: boolean;
          };
          const { autoNext: _dropped, ...rest } = state;
          if (version >= 1) return rest;

          const legacy: Readonly<Record<string, ScoreRange | undefined>> = {
            non_mangan: "nonMangan",
            mangan_plus: "manganPlus",
          };

          return {
            ...rest,
            targetScoreRanges: (rest.targetScoreRanges ?? []).map(
              (range) => legacy[range] ?? range,
            ),
          };
        },
      },
    ),
  );
}

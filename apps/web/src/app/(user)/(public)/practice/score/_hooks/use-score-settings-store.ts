import type { ScoreRange } from "@mahjong-scoring/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** 役も回答するかどうか */
  requireYaku: boolean;
  setRequireYaku: (enabled: boolean) => void;
  /** 5翻以降を簡略化するかどうか */
  simplifyMangan: boolean;
  setSimplifyMangan: (enabled: boolean) => void;
  /** 満貫以上でも符を入力するかどうか */
  requireFuForMangan: boolean;
  setRequireFuForMangan: (enabled: boolean) => void;
  /** 出題する点数範囲 */
  targetScoreRanges: ScoreRange[];
  setTargetScoreRanges: (ranges: ScoreRange[]) => void;
  /** 正解時に自動で次の問題へ進むかどうか */
  autoNext: boolean;
  setAutoNext: (enabled: boolean) => void;
  /** 親を出題に含めるかどうか */
  includeParent: boolean;
  setIncludeParent: (enabled: boolean) => void;
  /** 子を出題に含めるかどうか */
  includeChild: boolean;
  setIncludeChild: (enabled: boolean) => void;
}

/**
 * 点数計算練習設定ストア（永続化あり）
 * 点数練習設定
 */
export const useScoreSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      requireYaku: false,
      setRequireYaku: (requireYaku) => set({ requireYaku }),
      simplifyMangan: false,
      setSimplifyMangan: (simplifyMangan) => set({ simplifyMangan }),
      requireFuForMangan: false,
      setRequireFuForMangan: (requireFuForMangan) =>
        set({ requireFuForMangan }),
      targetScoreRanges: ["nonMangan", "manganPlus"],
      setTargetScoreRanges: (targetScoreRanges) => set({ targetScoreRanges }),
      autoNext: false,
      setAutoNext: (autoNext) => set({ autoNext }),
      includeParent: true,
      setIncludeParent: (includeParent) => set({ includeParent }),
      includeChild: true,
      setIncludeChild: (includeChild) => set({ includeChild }),
    }),
    {
      name: "mahjong-practice-settings",
      // v0 は点数帯を snake_case（"non_mangan" / "mangan_plus"）で保存していた。
      // 型を core の ScoreRange（camelCase）へ統一したため、保存済みの値を
      // 変換する。変換しないと全チェックが外れ、練習を開始できなくなる。
      version: 1,
      migrate: (persisted, version) => {
        if (version >= 1) return persisted as SettingsState;

        const state = persisted as Partial<SettingsState> & {
          targetScoreRanges?: readonly string[];
        };
        const legacy: Readonly<Record<string, ScoreRange>> = {
          non_mangan: "nonMangan",
          mangan_plus: "manganPlus",
        };

        return {
          ...state,
          targetScoreRanges: (state.targetScoreRanges ?? []).map(
            (range) => legacy[range] ?? (range as ScoreRange),
          ),
        } as SettingsState;
      },
    },
  ),
);

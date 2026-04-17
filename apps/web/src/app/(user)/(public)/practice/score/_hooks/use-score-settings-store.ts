import { create } from "zustand";
import { persist } from "zustand/middleware";

type ScoreRange = "non_mangan" | "mangan_plus";

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
      setRequireFuForMangan: (requireFuForMangan) => set({ requireFuForMangan }),
      targetScoreRanges: ["non_mangan", "mangan_plus"],
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
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ScoreTableRange = "nonMangan" | "manganPlus";

interface ScoreTableSettingsState {
  /** 親を出題に含めるか */
  includeOya: boolean;
  setIncludeOya: (enabled: boolean) => void;
  /** 子を出題に含めるか */
  includeKo: boolean;
  setIncludeKo: (enabled: boolean) => void;
  /** ツモを出題に含めるか */
  includeTsumo: boolean;
  setIncludeTsumo: (enabled: boolean) => void;
  /** ロンを出題に含めるか */
  includeRon: boolean;
  setIncludeRon: (enabled: boolean) => void;
  /** 出題する点数帯 */
  targetScoreRanges: ScoreTableRange[];
  setTargetScoreRanges: (ranges: ScoreTableRange[]) => void;
}

/**
 * 点数表早引き練習の設定ストア（永続化あり）
 * 点数表練習設定
 *
 * 既定は全軸オン（親子・ツモロン・満貫未満/満貫以上のすべて）。
 */
export const useScoreTableSettingsStore = create<ScoreTableSettingsState>()(
  persist(
    (set) => ({
      includeOya: true,
      setIncludeOya: (includeOya) => set({ includeOya }),
      includeKo: true,
      setIncludeKo: (includeKo) => set({ includeKo }),
      includeTsumo: true,
      setIncludeTsumo: (includeTsumo) => set({ includeTsumo }),
      includeRon: true,
      setIncludeRon: (includeRon) => set({ includeRon }),
      targetScoreRanges: ["nonMangan", "manganPlus"],
      setTargetScoreRanges: (targetScoreRanges) => set({ targetScoreRanges }),
    }),
    {
      name: "mahjong-score-table-settings",
    },
  ),
);

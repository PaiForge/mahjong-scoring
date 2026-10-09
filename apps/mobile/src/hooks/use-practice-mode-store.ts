import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_PRACTICE_MODE,
  type PracticeMode,
} from "@mahjong-scoring/features/practice/practice-mode";

interface PracticeModeState {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
}

/**
 * 練習一覧で最後に選んだ表示（モバイル・AsyncStorage に永続化）
 * 練習モードストア
 *
 * web の `PracticeModeSwitcher` が localStorage の `practice-mode` に残すのと
 * 同じく、次に一覧を開いたときは最後に選んだ方を出す。既定は基礎練習。
 */
export const usePracticeModeStore = create<PracticeModeState>()(
  persist(
    (set) => ({
      mode: DEFAULT_PRACTICE_MODE,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "practice-mode",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

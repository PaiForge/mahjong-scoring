import type { ScoreRange } from "@mahjong-scoring/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ScoreSettingsState {
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
  /** 出題する役（日本語役名、空 = 絞り込みなし） */
  targetYaku: string[];
  setTargetYaku: (yaku: string[]) => void;
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
 * 点数計算系の練習の設定ストアを作る（永続化あり）
 * 点数練習設定ストア生成
 *
 * 点数計算総合演習と待ち別点数計算は同じ設定項目を持つが、片方で変えた
 * 設定がもう片方に及ばないよう、練習ごとに別の保存名で持つ。
 *
 * @param name - localStorage の保存名
 */
export function createScoreSettingsStore(name: string) {
  return create<ScoreSettingsState>()(
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
        targetYaku: [],
        setTargetYaku: (targetYaku) => set({ targetYaku }),
        autoNext: false,
        setAutoNext: (autoNext) => set({ autoNext }),
        includeParent: true,
        setIncludeParent: (includeParent) => set({ includeParent }),
        includeChild: true,
        setIncludeChild: (includeChild) => set({ includeChild }),
      }),
      {
        name,
        // v0 は点数帯を snake_case（"non_mangan" / "mangan_plus"）で保存していた。
        // 型を core の ScoreRange（camelCase）へ統一したため、保存済みの値を
        // 変換する。変換しないと全チェックが外れ、練習を開始できなくなる。
        version: 1,
        migrate: (persisted, version) => {
          if (version >= 1) return persisted as ScoreSettingsState;

          const state = persisted as Partial<ScoreSettingsState> & {
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
          } as ScoreSettingsState;
        },
      },
    ),
  );
}

/**
 * 点数計算総合演習の設定ストア
 * 点数練習設定
 */
export const useScoreSettingsStore = createScoreSettingsStore(
  "mahjong-practice-settings",
);

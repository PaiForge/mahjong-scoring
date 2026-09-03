import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_DORA_DISPLAY_MODE,
  type DoraDisplayMode,
} from "@/app/_lib/dora-display";
import { useHydrated } from "./use-hydrated";

interface DisplaySettingsState {
  /** ドラを表示牌のまま出すか、ドラそのものに読み替えて出すか */
  doraDisplay: DoraDisplayMode;
  setDoraDisplay: (mode: DoraDisplayMode) => void;
  /** 教本本文の語を用語リンクにするか */
  termLinks: boolean;
  setTermLinks: (enabled: boolean) => void;
}

/**
 * 用語リンクは既定で出す。
 *
 * 語の意味を知らない読者にとっては本文の一部であり、初めて読む側が
 * 設定を開いて有効化するとは考えにくい。用語を覚えて邪魔になった読者が
 * 切る、という向きにしてある。
 */
const DEFAULT_TERM_LINKS_ENABLED = true;

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
      termLinks: DEFAULT_TERM_LINKS_ENABLED,
      setTermLinks: (termLinks) => set({ termLinks }),
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
 * ハイドレーション完了までは既定値を返す（理由は {@link useHydrated} 参照）。
 * ドラ表示モード
 */
export function useDoraDisplayMode(): DoraDisplayMode {
  const doraDisplay = useDisplaySettingsStore((s) => s.doraDisplay);
  return useHydrated(doraDisplay, DEFAULT_DORA_DISPLAY_MODE);
}

/**
 * 用語リンクの有効判定フック
 *
 * ハイドレーション完了までは既定値を返す（理由は {@link useHydrated} 参照）。
 * サーバーが描いた HTML は常にリンク入りなので、クローラと
 * JavaScript 無効の閲覧者にはこの設定に関わらず内部リンクが見える。
 * 用語リンク有効判定
 */
export function useTermLinksEnabled(): boolean {
  const termLinks = useDisplaySettingsStore((s) => s.termLinks);
  return useHydrated(termLinks, DEFAULT_TERM_LINKS_ENABLED);
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_DORA_DISPLAY_MODE,
  type DoraDisplayMode,
} from "./dora-display";
import { DEFAULT_FU_HAN_ORDER, type FuHanOrder } from "./fu-han-order";
import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "./settings-store-options";

/** 表示設定ストアの状態と更新関数 */
export interface DisplaySettingsState {
  /** ドラを表示牌のまま出すか、ドラそのものに読み替えて出すか */
  doraDisplay: DoraDisplayMode;
  setDoraDisplay: (mode: DoraDisplayMode) => void;
  /** 教本本文の語を用語リンクにするか */
  termLinks: boolean;
  setTermLinks: (enabled: boolean) => void;
  /** 符と翻を「30符 4翻」と「4翻 30符」のどちらの順で出すか */
  fuHanOrder: FuHanOrder;
  setFuHanOrder: (order: FuHanOrder) => void;
}

/**
 * 用語リンクは既定で出す。
 *
 * 語の意味を知らない読者にとっては本文の一部であり、初めて読む側が
 * 設定を開いて有効化するとは考えにくい。用語を覚えて邪魔になった読者が
 * 切る、という向きにしてある。設定画面のスイッチは他の項目と同じく既定 OFF に
 * 見せるため、この値を反転して「用語リンクなしで表示する」として出す。
 */
export const DEFAULT_TERM_LINKS_ENABLED = true;

/**
 * 表示設定ストアを作る（端末ローカル永続化）
 * 表示設定ストア生成
 *
 * 出題内容や正解判定を変えず、見せ方だけを切り替える設定を保持する。
 * ルール差分（ルール設定ストア）とは別に持つのは、こちらが
 * 「麻雀のルール」ではなく「この画面での見え方」の選択だから。
 * アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先とハイドレーションガード（保存名は
 *   `mahjong-display-settings` 固定）
 */
export function createDisplaySettingsStore({
  storage,
  useHydrated = passThroughHydration,
}: SettingsStoreOptions) {
  const useDisplaySettingsStore = create<DisplaySettingsState>()(
    persist(
      (set) => ({
        doraDisplay: DEFAULT_DORA_DISPLAY_MODE,
        setDoraDisplay: (doraDisplay) => set({ doraDisplay }),
        termLinks: DEFAULT_TERM_LINKS_ENABLED,
        setTermLinks: (termLinks) => set({ termLinks }),
        fuHanOrder: DEFAULT_FU_HAN_ORDER,
        setFuHanOrder: (fuHanOrder) => set({ fuHanOrder }),
      }),
      {
        // 既定の浅いマージ（永続値を初期state へ上書き）により、
        // 将来キーを追加しても欠損フィールドは既定値で補完される。
        name: "mahjong-display-settings",
        storage: createJSONStorage(storage),
      },
    ),
  );

  /**
   * ドラの表示モード取得フック
   * ドラ表示モード
   *
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   */
  function useDoraDisplayMode(): DoraDisplayMode {
    const doraDisplay = useDisplaySettingsStore((s) => s.doraDisplay);
    return useHydrated(doraDisplay, DEFAULT_DORA_DISPLAY_MODE);
  }

  /**
   * 用語リンクの有効判定フック
   * 用語リンク有効判定
   *
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   * web ではサーバーが描いた HTML は常にリンク入りなので、クローラと
   * JavaScript 無効の閲覧者にはこの設定に関わらず内部リンクが見える。
   */
  function useTermLinksEnabled(): boolean {
    const termLinks = useDisplaySettingsStore((s) => s.termLinks);
    return useHydrated(termLinks, DEFAULT_TERM_LINKS_ENABLED);
  }

  /**
   * 符と翻の表記順取得フック
   * 符翻表記順
   *
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   */
  function useFuHanOrder(): FuHanOrder {
    const fuHanOrder = useDisplaySettingsStore((s) => s.fuHanOrder);
    return useHydrated(fuHanOrder, DEFAULT_FU_HAN_ORDER);
  }

  return {
    useDisplaySettingsStore,
    useDoraDisplayMode,
    useTermLinksEnabled,
    useFuHanOrder,
  };
}

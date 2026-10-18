import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_DORA_DISPLAY_MODE,
  type DoraDisplayMode,
} from "./dora-display";
import { DEFAULT_FU_HAN_ORDER, type FuHanOrder } from "./fu-han-order";
import {
  DEFAULT_KO_TSUMO_INPUT,
  type KoTsumoInputMode,
} from "./ko-tsumo-input";
import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "./settings-store-options";
import {
  DEFAULT_TILE_ORDER,
  normalizeTileOrder,
  type TileOrderMode,
} from "./tile-order";
import {
  DEFAULT_TILE_ORIENTATION,
  normalizeTileOrientation,
  type TileOrientationMode,
} from "./tile-orientation";

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
  /** 子のツモの点数を組の 1 つの select で選ぶか、子から・親からの 2 つで選ぶか */
  koTsumoInput: KoTsumoInputMode;
  setKoTsumoInput: (mode: KoTsumoInputMode) => void;
  /**
   * 練習の盤面で手牌の上下をランダムにするか（保存した希望）
   *
   * Pro の特典が無い間も保存値は消さない。有効な向きは
   * `resolveHandPresentationSettings`（features の `board/hand-presentation.ts`）が
   * 特典と合わせて決める。
   */
  tileOrientation: TileOrientationMode;
  setTileOrientation: (mode: TileOrientationMode) => void;
  /**
   * 練習の盤面で手牌を理牌せずに並べるか（保存した希望）
   *
   * 上下ランダムとは独立した項目（片方だけ欲しい人が選べるよう、「見せ方」の
   * 1 つの選択にまとめない）。保存値と特典の扱いは `tileOrientation` と同じ。
   */
  tileOrder: TileOrderMode;
  setTileOrder: (mode: TileOrderMode) => void;
}

/**
 * 表示設定の永続値の読み込み状態
 * 表示設定復元状態
 *
 * - `pending` — 読み込み中（読み込みを始める前も含む）
 * - `ready` — 読み込みが済んだ（保存値が無かった場合も含む）
 * - `failed` — 直近の読み込みに失敗した。設定の値はその読み込みの前のまま —
 *   最初の読み込みなら既定値、読み込みが済んだ後の読み直し（`rehydrate()`）なら
 *   前に読めた値が残る。どちらの場合も保存値を読めたとは見なさない
 *
 * メモリ上の初期値（既定値）と「保存値を読んだ結果が既定値だった」を区別する
 * ために持つ。zustand の `persist.hasHydrated()` / `onFinishHydration` は
 * 失敗を知らせないため、それだけでは区別できない。
 */
export type DisplaySettingsHydrationStatus = "pending" | "ready" | "failed";

interface DisplaySettingsHydrationState {
  readonly status: DisplaySettingsHydrationStatus;
}

/** 値がオブジェクト（配列を除く）か */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 永続値の中から、許される値のときだけ項目を取り出す */
function pickOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

/**
 * 永続値を現在の状態へ重ねる
 *
 * 項目ごとに値を確かめ、欠損・未知の値・型違いは現在の値（既定値）のまま残す。
 * 更新関数は永続値に含まれないが、壊れた永続値が同名のキーを持っていても
 * 置き換えないよう、知っている項目だけを拾う。
 */
function mergeDisplaySettings(
  persisted: unknown,
  current: DisplaySettingsState,
): DisplaySettingsState {
  if (!isRecord(persisted)) return current;
  const termLinks = persisted.termLinks;
  return {
    ...current,
    doraDisplay:
      pickOneOf<DoraDisplayMode>(persisted.doraDisplay, [
        "indicator",
        "actual",
      ]) ?? current.doraDisplay,
    termLinks: typeof termLinks === "boolean" ? termLinks : current.termLinks,
    fuHanOrder:
      pickOneOf<FuHanOrder>(persisted.fuHanOrder, ["fu-first", "han-first"]) ??
      current.fuHanOrder,
    koTsumoInput:
      pickOneOf<KoTsumoInputMode>(persisted.koTsumoInput, [
        "combined",
        "split",
      ]) ?? current.koTsumoInput,
    tileOrientation: normalizeTileOrientation(persisted.tileOrientation),
    tileOrder: normalizeTileOrder(persisted.tileOrder),
  };
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
  // 読み込み状態は永続化しない別のストアに持つ。persist の set を通すと
  // 状態が変わるたびに保存先へ書き込みが走るため
  const useHydrationStore = create<DisplaySettingsHydrationState>()(() => ({
    status: "pending",
  }));

  const useDisplaySettingsStore = create<DisplaySettingsState>()(
    persist(
      (set) => ({
        doraDisplay: DEFAULT_DORA_DISPLAY_MODE,
        setDoraDisplay: (doraDisplay) => set({ doraDisplay }),
        termLinks: DEFAULT_TERM_LINKS_ENABLED,
        setTermLinks: (termLinks) => set({ termLinks }),
        fuHanOrder: DEFAULT_FU_HAN_ORDER,
        setFuHanOrder: (fuHanOrder) => set({ fuHanOrder }),
        koTsumoInput: DEFAULT_KO_TSUMO_INPUT,
        setKoTsumoInput: (koTsumoInput) => set({ koTsumoInput }),
        tileOrientation: DEFAULT_TILE_ORIENTATION,
        setTileOrientation: (tileOrientation) => set({ tileOrientation }),
        tileOrder: DEFAULT_TILE_ORDER,
        setTileOrder: (tileOrder) => set({ tileOrder }),
      }),
      {
        // 項目ごとに確かめて重ねるため、将来キーを追加しても欠損フィールドは
        // 既定値で補完される。
        name: "mahjong-display-settings",
        storage: createJSONStorage(storage),
        merge: mergeDisplaySettings,
        // 読み込みの開始と完了を別のストアへ写す。重なった rehydrate() の
        // 古い完了は zustand が世代（hydrationVersion）で捨てるので、ここへは
        // 最新の読み込みの結果だけが届く。保存先が無く読み込み自体が始まらない
        // ときは pending のまま残る（待つ側が期限で諦める）
        onRehydrateStorage: () => {
          useHydrationStore.setState({ status: "pending" });
          // 成功なら状態が、失敗なら state 無しでエラーが渡る
          return (state, error) => {
            useHydrationStore.setState({
              status:
                state !== undefined && error === undefined ? "ready" : "failed",
            });
          };
        },
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

  /**
   * 子ツモの点数の入力方式取得フック
   * 子ツモ入力方式
   *
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   * web では分割入力を選んだ人も描画直後は 1 つの select で描き、
   * ハイドレーション後に 2 つへ分かれる（select の高さは同じなので縦にはずれない）。
   */
  function useKoTsumoInput(): KoTsumoInputMode {
    const koTsumoInput = useDisplaySettingsStore((s) => s.koTsumoInput);
    return useHydrated(koTsumoInput, DEFAULT_KO_TSUMO_INPUT);
  }

  /**
   * 手牌の向きの保存値取得フック
   * 牌の向き保存値
   *
   * 保存した希望をそのまま返す（特典の有無は見ない）。設定画面のスイッチ用。
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   */
  function useTileOrientationSetting(): TileOrientationMode {
    const tileOrientation = useDisplaySettingsStore((s) => s.tileOrientation);
    return useHydrated(tileOrientation, DEFAULT_TILE_ORIENTATION);
  }

  /**
   * 手牌の並べ方の保存値取得フック
   * 牌の並び順保存値
   *
   * 保存した希望をそのまま返す（特典の有無は見ない）。設定画面のスイッチ用。
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   */
  function useTileOrderSetting(): TileOrderMode {
    const tileOrder = useDisplaySettingsStore((s) => s.tileOrder);
    return useHydrated(tileOrder, DEFAULT_TILE_ORDER);
  }

  /**
   * 表示設定の永続値の読み込み状態取得フック
   * 表示設定復元状態
   *
   * web はストアを作った時点で同期で読み終わり、モバイルは AsyncStorage の
   * 読み込みが終わってから `ready` になる。読み込みに失敗すれば `failed`。
   * 練習の盤面の見せ方を決める前に、保存値が読めたかを確かめるのに使う。
   */
  function useDisplaySettingsHydration(): DisplaySettingsHydrationStatus {
    return useHydrationStore((s) => s.status);
  }

  return {
    useDisplaySettingsStore,
    useDisplaySettingsHydration,
    useTileOrientationSetting,
    useTileOrderSetting,
    useDoraDisplayMode,
    useTermLinksEnabled,
    useFuHanOrder,
    useKoTsumoInput,
  };
}

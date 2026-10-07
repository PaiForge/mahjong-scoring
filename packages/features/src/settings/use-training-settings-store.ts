import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "./settings-store-options";

/** トレーニング設定ストアの状態と更新関数 */
export interface TrainingSettingsState {
  /**
   * 正解したとき、答え合わせを挟まず次の問題へ進むか。トレーニングに加えて、
   * 時計もミス上限も無い点数計算の演習（和了形の点数計算・聴牌形の点数計算）も読む。
   * 演習の設定画面のスイッチもこの値を書く（設定ページは会員限定のため、
   * 未ログインでも演習の設定画面から切り替えられるようにしてある）
   */
  autoAdvanceOnCorrect: boolean;
  setAutoAdvanceOnCorrect: (enabled: boolean) => void;
}

/**
 * 正解時も止まるのが既定。
 *
 * トレーニングは時間無制限で反復する場所なので、合っていた根拠（符の内訳・
 * 符目ごとの正解・点数の内訳）を毎回確かめられる側を既定に置く。テンポを
 * 優先したい人が自分で切り替える、という向きにしてある。
 */
export const DEFAULT_AUTO_ADVANCE_ON_CORRECT = false;

/**
 * トレーニング設定ストアを作る（端末ローカル永続化）
 * トレーニング設定ストア生成
 *
 * 出題内容も正解判定も変えず、トレーニングの進み方だけを切り替える設定を持つ。
 * ルール差分（ルール設定ストア）・表示（表示設定ストア）と分けているのは、
 * これが「麻雀のルール」でも「見え方」でもなく「練習セッションの運び」の
 * 選択だから。アプリごとに 1 回だけ呼び、戻り値を共有すること。
 *
 * @param options 保存先とハイドレーションガード（保存名は
 *   `mahjong-training-settings` 固定）
 */
export function createTrainingSettingsStore({
  storage,
  useHydrated = passThroughHydration,
}: SettingsStoreOptions) {
  const useTrainingSettingsStore = create<TrainingSettingsState>()(
    persist(
      (set) => ({
        autoAdvanceOnCorrect: DEFAULT_AUTO_ADVANCE_ON_CORRECT,
        setAutoAdvanceOnCorrect: (autoAdvanceOnCorrect) =>
          set({ autoAdvanceOnCorrect }),
      }),
      {
        // 既定の浅いマージ（永続値を初期state へ上書き）により、
        // 将来キーを追加しても欠損フィールドは既定値で補完される。
        name: "mahjong-training-settings",
        storage: createJSONStorage(storage),
      },
    ),
  );

  /**
   * 正解時の自動遷移が有効かの判定フック
   * 正解時自動遷移の判定
   *
   * ハイドレーション完了までは既定値を返す（`useHydrated` を渡した場合）。
   */
  function useAutoAdvanceOnCorrect(): boolean {
    const autoAdvanceOnCorrect = useTrainingSettingsStore(
      (s) => s.autoAdvanceOnCorrect,
    );
    return useHydrated(autoAdvanceOnCorrect, DEFAULT_AUTO_ADVANCE_ON_CORRECT);
  }

  return { useTrainingSettingsStore, useAutoAdvanceOnCorrect };
}

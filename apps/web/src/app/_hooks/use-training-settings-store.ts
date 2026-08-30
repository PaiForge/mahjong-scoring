import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useIsClient } from "./use-is-client";

interface TrainingSettingsState {
  /** トレーニングで正解したとき、答え合わせを挟まず次の問題へ進むか */
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
const DEFAULT_AUTO_ADVANCE_ON_CORRECT = false;

/**
 * トレーニング設定ストア（端末ローカル永続化）
 *
 * 出題内容も正解判定も変えず、トレーニングの進み方だけを切り替える設定を持つ。
 * ルール差分（`useRuleSettingsStore`）・表示（`useDisplaySettingsStore`）と
 * 分けているのは、これが「麻雀のルール」でも「見え方」でもなく
 * 「練習セッションの運び」の選択だから。
 * トレーニング設定ストア
 */
export const useTrainingSettingsStore = create<TrainingSettingsState>()(
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
    },
  ),
);

/**
 * 正解時の自動遷移が有効かの判定フック
 *
 * ハイドレーション完了までは既定値を返す。永続値は localStorage から
 * ストア生成時に同期的に載るため、そのまま読むと SSR 済みの HTML
 * （＝常に既定値）と初回クライアントレンダーがずれる。
 * 正解時自動遷移の判定
 */
export function useAutoAdvanceOnCorrect(): boolean {
  const isClient = useIsClient();
  const autoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.autoAdvanceOnCorrect,
  );
  return isClient ? autoAdvanceOnCorrect : DEFAULT_AUTO_ADVANCE_ON_CORRECT;
}

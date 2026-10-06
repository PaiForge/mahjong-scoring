import { useTranslations } from "use-intl";

import {
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import {
  useAutoAdvanceOnCorrect,
  useTrainingSettingsStore,
} from "../hooks/use-training-settings-store";

/**
 * トレーニング設定セクション
 *
 * 端末ローカルに保存される「トレーニングの進み方」の設定を切り替える。
 * 出題内容も正解判定も変わらず、チャレンジ（制限時間あり）にも影響しない
 * （web の `TrainingSettingsSection`）。
 */
export function TrainingSettingsSection() {
  const t = useTranslations("settings");
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const setAutoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.setAutoAdvanceOnCorrect,
  );

  return (
    <SettingsCard>
      <SettingToggleRow
        title={t("autoAdvanceOnCorrectTitle")}
        description={t("autoAdvanceOnCorrectDescription")}
        checked={autoAdvanceOnCorrect}
        onChange={setAutoAdvanceOnCorrect}
      />
    </SettingsCard>
  );
}

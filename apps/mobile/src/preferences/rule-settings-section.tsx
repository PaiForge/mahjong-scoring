import { useTranslations } from "use-intl";

import {
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import { useRuleSettingsStore } from "../hooks/use-rule-settings-store";

/**
 * ルール設定セクション
 *
 * 端末ローカルに保存される麻雀ルールの差分設定を切り替える。
 * 連風牌（場風＝自風）の雀頭符の扱い、切り上げ満貫の採否、
 * ダブル役満（四暗刻単騎・大四喜・国士十三面・純正九蓮）と
 * 複合役満の合算の採否を持つ（web の `RuleSettingsSection`）。
 */
export function RuleSettingsSection() {
  const t = useTranslations("settings");
  const s = useRuleSettingsStore();

  return (
    <SettingsCard>
      <SettingToggleRow
        title={t("renfonpaiTitle")}
        description={t("renfonpaiDescription")}
        checked={s.renfonpaiAs4Fu}
        onChange={s.setRenfonpaiAs4Fu}
      />
      <SettingToggleRow
        title={t("kiriageManganTitle")}
        description={t("kiriageManganDescription")}
        checked={s.kiriageMangan}
        onChange={s.setKiriageMangan}
      />
      <SettingToggleRow
        title={t("suuankouTankiDoubleTitle")}
        description={t("suuankouTankiDoubleDescription")}
        checked={s.suuankouTankiDouble}
        onChange={s.setSuuankouTankiDouble}
      />
      <SettingToggleRow
        title={t("daisuushiiDoubleTitle")}
        description={t("daisuushiiDoubleDescription")}
        checked={s.daisuushiiDouble}
        onChange={s.setDaisuushiiDouble}
      />
      <SettingToggleRow
        title={t("kokushiJuusanmenDoubleTitle")}
        description={t("kokushiJuusanmenDoubleDescription")}
        checked={s.kokushiJuusanmenDouble}
        onChange={s.setKokushiJuusanmenDouble}
      />
      <SettingToggleRow
        title={t("junseiChuurenDoubleTitle")}
        description={t("junseiChuurenDoubleDescription")}
        checked={s.junseiChuurenDouble}
        onChange={s.setJunseiChuurenDouble}
      />
      <SettingToggleRow
        title={t("fukugouYakumanTitle")}
        description={t("fukugouYakumanDescription")}
        checked={s.fukugouYakuman}
        onChange={s.setFukugouYakuman}
      />
    </SettingsCard>
  );
}

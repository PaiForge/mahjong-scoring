import { useTranslations } from "use-intl";
import { RULE_SETTING_TOGGLES } from "@mahjong-scoring/features/settings/rule-setting-toggles";
import {
  PREFERENCE_ANCHORS,
  type PreferenceAnchor,
} from "@mahjong-scoring/features/settings/preference-anchors";

import {
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import { useRuleSettingsStore } from "../hooks/use-rule-settings-store";

/**
 * 設定項目へのアンカー（レッスンなどから `/preferences?item=renfonpai` で
 * 直接開かれる。web の同名の表と同じ）
 *
 * ダブル役満・複合役満の採否は設定群の先頭項目にだけ付ける。
 */
const ANCHOR_BY_FIELD: Partial<
  Record<(typeof RULE_SETTING_TOGGLES)[number]["field"], PreferenceAnchor>
> = {
  renfonpaiAs4Fu: PREFERENCE_ANCHORS.renfonpai,
  kiriageMangan: PREFERENCE_ANCHORS.kiriageMangan,
  suuankouTankiDouble: PREFERENCE_ANCHORS.doubleYakuman,
};

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
  const settings = useRuleSettingsStore();

  return (
    <SettingsCard>
      {RULE_SETTING_TOGGLES.map(({ field, setter, messageKey }) => (
        <SettingToggleRow
          key={field}
          title={t(`${messageKey}Title`)}
          description={t(`${messageKey}Description`)}
          checked={settings[field]}
          onChange={settings[setter]}
          anchor={ANCHOR_BY_FIELD[field]}
        />
      ))}
    </SettingsCard>
  );
}

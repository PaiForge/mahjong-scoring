"use client";

import { useTranslations } from "next-intl";
import {
  SettingsCard,
  SettingToggleRow,
} from "@/app/(user)/_components/setting-toggle-row";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { PREFERENCE_ANCHORS } from "../_lib/anchors";

/**
 * ルール設定セクション
 *
 * 端末ローカルに保存される麻雀ルールの差分設定を切り替える。
 * 連風牌（場風＝自風）の雀頭符の扱いと、切り上げ満貫の採否を持つ。
 */
export function RuleSettingsSection() {
  const t = useTranslations("settings");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const setRenfonpaiAs4Fu = useRuleSettingsStore((s) => s.setRenfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const setKiriageMangan = useRuleSettingsStore((s) => s.setKiriageMangan);

  return (
    <SettingsCard>
      {/* 教本などから `/preferences#renfonpai` で直接飛んで来られる */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.renfonpai}
        title={t("renfonpaiTitle")}
        description={t("renfonpaiDescription")}
        checked={renfonpaiAs4Fu}
        onChange={setRenfonpaiAs4Fu}
      />
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.kiriageMangan}
        title={t("kiriageManganTitle")}
        description={t("kiriageManganDescription")}
        checked={kiriageMangan}
        onChange={setKiriageMangan}
      />
    </SettingsCard>
  );
}

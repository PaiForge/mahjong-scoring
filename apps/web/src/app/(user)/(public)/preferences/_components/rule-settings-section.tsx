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
 * 現状は連風牌（場風＝自風）の雀頭符の扱いのみ。
 */
export function RuleSettingsSection() {
  const t = useTranslations("settings");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const setRenfonpaiAs4Fu = useRuleSettingsStore((s) => s.setRenfonpaiAs4Fu);

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
    </SettingsCard>
  );
}

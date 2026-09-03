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
 * 連風牌（場風＝自風）の雀頭符の扱い、切り上げ満貫の採否、
 * ダブル役満（四暗刻単騎・大四喜・国士十三面・純正九蓮）と
 * 複合役満の合算の採否を持つ。
 */
export function RuleSettingsSection() {
  const t = useTranslations("settings");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const setRenfonpaiAs4Fu = useRuleSettingsStore((s) => s.setRenfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const setKiriageMangan = useRuleSettingsStore((s) => s.setKiriageMangan);
  const suuankouTankiDouble = useRuleSettingsStore(
    (s) => s.suuankouTankiDouble,
  );
  const setSuuankouTankiDouble = useRuleSettingsStore(
    (s) => s.setSuuankouTankiDouble,
  );
  const daisuushiiDouble = useRuleSettingsStore((s) => s.daisuushiiDouble);
  const setDaisuushiiDouble = useRuleSettingsStore(
    (s) => s.setDaisuushiiDouble,
  );
  const kokushiJuusanmenDouble = useRuleSettingsStore(
    (s) => s.kokushiJuusanmenDouble,
  );
  const setKokushiJuusanmenDouble = useRuleSettingsStore(
    (s) => s.setKokushiJuusanmenDouble,
  );
  const junseiChuurenDouble = useRuleSettingsStore(
    (s) => s.junseiChuurenDouble,
  );
  const setJunseiChuurenDouble = useRuleSettingsStore(
    (s) => s.setJunseiChuurenDouble,
  );
  const fukugouYakuman = useRuleSettingsStore((s) => s.fukugouYakuman);
  const setFukugouYakuman = useRuleSettingsStore((s) => s.setFukugouYakuman);

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
      {/* ダブル役満・複合役満の採否。アンカーは設定群の先頭項目に付ける */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.doubleYakuman}
        title={t("suuankouTankiDoubleTitle")}
        description={t("suuankouTankiDoubleDescription")}
        checked={suuankouTankiDouble}
        onChange={setSuuankouTankiDouble}
      />
      <SettingToggleRow
        title={t("daisuushiiDoubleTitle")}
        description={t("daisuushiiDoubleDescription")}
        checked={daisuushiiDouble}
        onChange={setDaisuushiiDouble}
      />
      <SettingToggleRow
        title={t("kokushiJuusanmenDoubleTitle")}
        description={t("kokushiJuusanmenDoubleDescription")}
        checked={kokushiJuusanmenDouble}
        onChange={setKokushiJuusanmenDouble}
      />
      <SettingToggleRow
        title={t("junseiChuurenDoubleTitle")}
        description={t("junseiChuurenDoubleDescription")}
        checked={junseiChuurenDouble}
        onChange={setJunseiChuurenDouble}
      />
      <SettingToggleRow
        title={t("fukugouYakumanTitle")}
        description={t("fukugouYakumanDescription")}
        checked={fukugouYakuman}
        onChange={setFukugouYakuman}
      />
    </SettingsCard>
  );
}

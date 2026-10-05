/**
 * 設定（環境設定）
 *
 * @description 麻雀ルールの差分設定・トレーニング設定・表示設定を集約する画面。
 * いずれも端末ローカルに保存する。web にあるプライバシー設定（ランキングへの
 * 表示可否）はアカウントに紐づくため、アカウントを持たないモバイルには無い。
 * 同じ理由で web の会員限定ゲートも掛けない。
 * @flow 下部タブ → 設定 →（役の並び順）
 */
import { View, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { DisplaySettingsSection } from "../../preferences/display-settings-section";
import { RuleSettingsSection } from "../../preferences/rule-settings-section";
import { TrainingSettingsSection } from "../../preferences/training-settings-section";

export default function PreferencesScreen() {
  const t = useTranslations("settings");

  return (
    <Screen title={t("pageTitle")} contentStyle={styles.content}>
      <View style={styles.section}>
        <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
        <RuleSettingsSection />
      </View>
      <View style={styles.section}>
        <SectionTitle>{t("trainingSectionTitle")}</SectionTitle>
        <TrainingSettingsSection />
      </View>
      <View style={styles.section}>
        <SectionTitle>{t("displaySectionTitle")}</SectionTitle>
        <DisplaySettingsSection />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
});

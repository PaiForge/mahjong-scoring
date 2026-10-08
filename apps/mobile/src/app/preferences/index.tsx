/**
 * 設定（環境設定）
 *
 * @description アカウント（ログイン・ログアウト・退会）と、麻雀ルールの差分設定・
 * トレーニング設定・表示設定を集約する画面。ルール・トレーニング・表示の設定は
 * ログインの有無に関わらず端末ローカルに保存する。web にあるプライバシー設定
 * （ランキングへの表示可否）はランキングの画面がアプリに無いので出さない。
 * 設定はゲストでも使えるので、web の会員限定ゲートは掛けない。
 * @flow ホームのヘッダーの歯車 → 設定 →（役の並び順）
 */
import { View, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { AccountSection } from "../../preferences/account-section";
import { DisplaySettingsSection } from "../../preferences/display-settings-section";
import { RuleSettingsSection } from "../../preferences/rule-settings-section";
import { TrainingSettingsSection } from "../../preferences/training-settings-section";

export default function PreferencesScreen() {
  const t = useTranslations("settings");

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <AccountSection style={styles.section} />
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

/**
 * 設定（環境設定）
 *
 * @description アカウント（ログアウト・退会）と、麻雀ルールの差分設定・
 * トレーニング設定・表示設定を集約する画面。ルール・トレーニング・表示の設定は
 * 端末ローカルに保存する。web にあるプライバシー設定（ランキングへの表示可否）は
 * ランキングの画面がアプリに無いので出さない。
 * 設定は web と同じくログイン中だけ使える。ゲストには会員限定ゲート
 * （`MembersOnlyGate`）で中身の代わりに登録・ログインの案内を出す。最後に
 * 利用規約・プライバシーポリシー等の web のページへの入口を置く（ゲートの外。
 * ゲストの入口はマイページにもある）。
 * @flow ホームのヘッダーの人型のアイコン → マイページ → 設定 →（役の並び順 / web のページ）
 */
import { View, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { AccountSection } from "../../preferences/account-section";
import { DisplaySettingsSection } from "../../preferences/display-settings-section";
import { MembersOnlyGate } from "../../preferences/members-only-gate";
import { RuleSettingsSection } from "../../preferences/rule-settings-section";
import { SiteLinksSection } from "../../preferences/site-links-section";
import { TrainingSettingsSection } from "../../preferences/training-settings-section";

export default function PreferencesScreen() {
  const t = useTranslations("settings");

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <AccountSection style={styles.section} />
      <MembersOnlyGate>
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
      </MembersOnlyGate>
      <SiteLinksSection />
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

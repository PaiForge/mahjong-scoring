/**
 * 設定（環境設定）
 *
 * @description 麻雀ルールの差分設定・
 * トレーニング設定・表示設定を集約する画面。ルール・トレーニング・表示の設定は
 * 端末ローカルに保存する。プライバシー（ランキングへの表示可否）は web と同じく
 * サーバーに保存し、アプリで記録した成績も載る web のランキングから外れられる
 * ようにする。
 * 設定は web と同じくログイン中だけ使える。ゲストには会員限定ゲート
 * （`MembersOnlyGate`）で中身の代わりに登録・ログインの案内を出す。
 * 利用規約・プライバシーポリシー等の web のページへの入口はここに置かず、
 * マイページの「その他」に置く（`SiteLinksSection`）。アカウント（ログアウト・
 * 退会）も web と同じくマイページのアカウントの画面にあり、ここには置かない。
 * @flow ホームのヘッダーの人型のアイコン → マイページ → 設定 →（役の並び順）
 */
import { View, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { DisplaySettingsSection } from "../../preferences/display-settings-section";
import { MembersOnlyGate } from "../../preferences/members-only-gate";
import { PrivacySettingsSection } from "../../preferences/privacy-settings-section";
import { RuleSettingsSection } from "../../preferences/rule-settings-section";
import { TrainingSettingsSection } from "../../preferences/training-settings-section";

export default function PreferencesScreen() {
  const t = useTranslations("settings");

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MembersOnlyGate>
        <PrivacySettingsSection style={styles.section} />
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

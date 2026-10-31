/**
 * 設定（環境設定）
 *
 * @description アプリの振る舞いを変える設定を集約する画面。節は web と同じ分類・
 * 同じ順で、麻雀ルール（ルールの差分）→ 練習（練習の進め方・答え方・盤面の見せ方と
 * 役の並び順への入口）→ 表示（ドラ・用語リンク・符と翻の順など、アプリ全体の見え方）
 * → プライバシー（ランキングへの表示可否。アカウントに紐づく）と並べる。ルール・練習・
 * 表示の設定は端末ローカルに保存する。プライバシーは web と同じくサーバーに保存し、
 * アプリで記録した成績も載る web のランキングから外れられるようにする。
 * 設定は web と同じくログイン中だけ使える。ゲストには会員限定ゲート
 * （`MembersOnlyGate`）で中身の代わりに登録・ログインの案内を出す。
 * 利用規約・プライバシーポリシー等の web のページへの入口はここに置かず、
 * マイページの「その他」に置く（`SiteLinksSection`）。アカウント（ログアウト・
 * 退会）も web と同じくマイページのアカウントの画面にあり、ここには置かない。
 * レッスン・盤面のドラの注記・点数表・用語のシート・ランキングから
 * `?item=` で項目を指して開かれたら、その行まで送る（`PreferenceAnchorProvider`）。
 *
 * 1 ページに保ち、節見出しで分ける。タブ・分類ごとの画面・折りたたみは採らない。
 * 4 節・20 行足らずは 1 画面に節見出しで並べる規模で、どの項目も変更の頻度が低く、
 * タブの既定で開くべき群が無い。また `?item=` で項目を指すリンクがレッスン・盤面・
 * 用語のシート・点数表・ランキング等から張られており、タブはその着地にタブの選択や
 * パスの変更を要求し、折りたたみは着地先の行とスイッチを隠す。
 * 1 つの節が 8 行を超える、全体が 25 行を超える、または Pro の項目が独自の節に
 * なる規模になったら見直す。そのときもタブではなく分類ごとの画面に分け、項目への
 * リンク（`preferencesHref`）が分類の画面の項目を指す形にする。
 *
 * プライバシーを末尾に置くのは web と同じ順に揃えるため。麻雀ルールを先頭に
 * 残すので、ログイン中の設定画面を開いて「麻雀ルール」を待つ確かめ方はそのまま効く。
 * @flow ホームのヘッダーの人型のアイコン → マイページ → 設定 →（役の並び順）
 */
import { View, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { DisplaySettingsSection } from "../../preferences/display-settings-section";
import { MembersOnlyGate } from "../../preferences/members-only-gate";
import { PracticeSettingsSection } from "../../preferences/practice-settings-section";
import { PreferenceAnchorProvider } from "../../preferences/preference-anchor";
import { PrivacySettingsSection } from "../../preferences/privacy-settings-section";
import { RuleSettingsSection } from "../../preferences/rule-settings-section";

export default function PreferencesScreen() {
  const t = useTranslations("settings");

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MembersOnlyGate>
        <PreferenceAnchorProvider style={styles.content}>
          <View style={styles.section}>
            <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
            <RuleSettingsSection />
          </View>
          <View style={styles.section}>
            <SectionTitle>{t("practiceSectionTitle")}</SectionTitle>
            <PracticeSettingsSection />
          </View>
          <View style={styles.section}>
            <SectionTitle>{t("displaySectionTitle")}</SectionTitle>
            <DisplaySettingsSection />
          </View>
          <PrivacySettingsSection style={styles.section} />
        </PreferenceAnchorProvider>
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

import { Linking, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { LinkRow, LinkRowList } from "../components/link-row";
import { SectionTitle } from "../components/section-title";
import { SITE_URL } from "../lib/app-site-url";

/**
 * web で開くページ（web のフッターの「その他」）
 *
 * 特定商取引法に基づく表記は載せない。Pro の価格と購入の条件を書いたページで、
 * アプリは Pro を扱わない（`apps/mobile/CLAUDE.md`）。アプリから開けると
 * アプリの外での購入へ誘導していると読まれうる（審査ガイドライン 3.1.1 / 3.1.3）。
 */
const SITE_PAGES = [
  { key: "terms", path: "/terms" },
  { key: "privacy", path: "/privacy" },
  { key: "contact", path: "/contact" },
  { key: "company", path: "/company" },
] as const;

/**
 * 設定の「その他」の節
 * サイトのページへのリンク
 *
 * 利用規約・プライバシーポリシー・お問い合わせ・運営者情報を web のページで
 * 開く。プライバシーポリシーはアプリの中から開けることが審査で求められる
 * （ガイドライン 5.1.1）。本文を画面として移さないのは、改定のたびに
 * アプリの版を出し直さずに済ませ、web と食い違わせないため。ページは
 * ブラウザに渡して開く。
 */
export function SiteLinksSection() {
  const t = useTranslations("footer");
  return (
    <View style={styles.section}>
      <SectionTitle>{t("other")}</SectionTitle>
      <LinkRowList>
        {SITE_PAGES.map(({ key, path }) => (
          <LinkRow
            key={key}
            title={t(key)}
            onPress={() => void Linking.openURL(`${SITE_URL}${path}`)}
            testID={`site-link-${key}`}
          />
        ))}
      </LinkRowList>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
});

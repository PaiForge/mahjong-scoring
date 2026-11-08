import { Linking, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  type MobileWebPage,
  webLocalePath,
} from "@mahjong-scoring/features/i18n/web-locale-path";

import { LinkRow, LinkRowList } from "../components/link-row";
import { SectionTitle } from "../components/section-title";
import { SITE_URL } from "../lib/app-site-url";
import { useAppLocale } from "../lib/use-app-locale";

/**
 * web で開くページ（web のフッターの「その他」）
 *
 * 特定商取引法に基づく表記は載せない。アプリの Pro は App Store の課金で買い、
 * 特商法の表記は web の Stripe での購入の条件（価格・支払い方法）を書いたページ
 * なので、アプリから開けるとアプリの外での購入へ誘導していると読まれうる
 * （審査ガイドライン 3.1.1）。
 *
 * パスは features の `MOBILE_WEB_PAGES` の中から選ぶ（型で縛る）。英語の端末では
 * `/en/...` を開き、その一覧が英語で公開済みであることを web のテストが固定する。
 */
const SITE_PAGES: readonly {
  readonly key: "terms" | "privacy" | "contact" | "company";
  readonly path: MobileWebPage;
}[] = [
  { key: "terms", path: "/terms" },
  { key: "privacy", path: "/privacy" },
  { key: "contact", path: "/contact" },
  { key: "company", path: "/company" },
];

/**
 * マイページの「その他」の節
 * サイトのページへのリンク
 *
 * 利用規約・プライバシーポリシー・お問い合わせ・運営者情報を web のページで
 * 開く。プライバシーポリシーはアプリの中から開けることが審査で求められる
 * （ガイドライン 5.1.1）。本文を画面として移さないのは、改定のたびに
 * アプリの版を出し直さずに済ませ、web と食い違わせないため。ページは
 * ブラウザに渡して開く。英語の端末では web の英語のページ（`/en/...`）を開く。
 *
 * 置き場所はマイページの末尾で、ゲストにもログイン中の人にも出す。以前は
 * 設定の最後にも置いていたが、設定はアプリの振る舞いを変える項目の画面で、
 * 規約やお問い合わせはそこに属さないため外した。マイページは web のフッターと
 * アカウントのメニューを兼ねる場所なので、web のフッターの「その他」に当たる
 * これもここに置く。
 */
export function SiteLinksSection() {
  const t = useTranslations("footer");
  const locale = useAppLocale();
  return (
    <View style={styles.section}>
      <SectionTitle>{t("other")}</SectionTitle>
      <LinkRowList>
        {SITE_PAGES.map(({ key, path }) => (
          <LinkRow
            key={key}
            title={t(key)}
            onPress={() =>
              void Linking.openURL(`${SITE_URL}${webLocalePath(path, locale)}`)
            }
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

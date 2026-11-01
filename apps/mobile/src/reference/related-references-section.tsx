import { useNavigation, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  relatedReferences,
  type ReferenceKey,
} from "@mahjong-scoring/features/reference/related-references";

import { LinkRow, LinkRowList } from "../components/link-row";
import { SectionTitle } from "../components/section-title";
import { useGoToTab } from "../hooks/use-go-to-tab";
import { findRouteIndexByHref } from "../lib/route-pathname";

/** アプリの点数表のパス（下部タブ。web は `/reference/score-table`） */
const SCORE_TABLE_PATH = "/score-table";

/**
 * 早見表の下に置く「ほかの早見表」の行（自分を除く）
 * 関連早見表セクション
 *
 * 点数表はタブなので `useGoToTab` で移る。役一覧・用語集は履歴にあれば
 * そこまで閉じて戻り、無ければ積む — 毎回積むと、行き来するたびに
 * スタックが深くなる。
 *
 * @param current - このセクションを置く早見表
 */
export function RelatedReferencesSection({
  current,
}: {
  readonly current: ReferenceKey;
}) {
  const t = useTranslations("reference");
  const router = useRouter();
  const navigation = useNavigation();
  const goToTab = useGoToTab();

  const open = (key: ReferenceKey, href: string) => {
    if (key === "scoreTable") {
      goToTab(href);
      return;
    }
    const state = navigation.getState();
    const inHistory =
      state !== undefined &&
      findRouteIndexByHref(state.routes, state.index, href) !== undefined;
    if (inHistory) router.dismissTo(href);
    else router.push(href);
  };

  return (
    <View style={styles.section}>
      <SectionTitle>{t("relatedTitle")}</SectionTitle>
      <LinkRowList>
        {relatedReferences(current, SCORE_TABLE_PATH).map(({ key, href }) => (
          <LinkRow
            key={key}
            testID={`related-reference-${key}`}
            onPress={() => open(key, href)}
            title={t(`${key}.title`)}
            description={t(`${key}.description`)}
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

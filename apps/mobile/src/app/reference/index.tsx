import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";
import { REFERENCE_YAKU_PATH } from "@mahjong-scoring/features/routes";

import {
  BookIcon,
  MagnifyingGlassIcon,
  TableIcon,
} from "../../components/icons/icons";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";

/** 点数表のタブのパス（モバイルは点数表をタブに置く。web は `/reference/score-table`） */
const SCORE_TABLE_TAB_PATH = "/score-table";

/**
 * 早見表（ハブ）
 *
 * @description
 * 点数表・役一覧・用語集への入口（web の `/reference`）。web は細枠の
 * カードを並べるが、どれも読みに行くだけの導線なので行のリストにする。
 *
 * @flow
 * 点数表のタブの見出しの右の「早見表」から開き、点数表・役一覧・用語集へ進む。
 */
export default function ReferenceHubScreen() {
  const t = useTranslations("reference");
  const router = useRouter();

  const links = [
    {
      href: SCORE_TABLE_TAB_PATH,
      title: t("scoreTable.title"),
      description: t("scoreTable.description"),
      icon: <TableIcon size={20} color={colors.primary600} />,
    },
    {
      href: REFERENCE_YAKU_PATH,
      title: t("yaku.title"),
      description: t("yaku.description"),
      icon: <BookIcon size={20} color={colors.primary600} />,
    },
    {
      href: GLOSSARY_PATH,
      title: t("glossary.title"),
      description: t("glossary.description"),
      icon: <MagnifyingGlassIcon size={20} color={colors.primary600} />,
    },
  ];

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <View style={styles.section}>
        <SectionTitle>{t("sectionTitle")}</SectionTitle>
        <Text style={styles.description}>{t("description")}</Text>
      </View>
      <LinkRowList>
        {links.map((link) => (
          <LinkRow
            key={link.href}
            onPress={() => router.push(link.href)}
            leading={<View style={styles.icon}>{link.icon}</View>}
            title={link.title}
            description={link.description}
          />
        ))}
      </LinkRowList>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
});

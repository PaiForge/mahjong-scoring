import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import { colors } from "../lib/theme";
import { BeltBadge } from "./belt-badge";
import { RankStatusBadge } from "./rank-status-badge";

/**
 * 級カードの見出し行（web の `RankHeading`）
 * 段級位見出し
 *
 * 帯バッジ・「5級 — 満貫以上の点数計算ができること」・取得状態の pill を
 * 横に並べる。級名と合格基準をつなげた 1 文は級の詳細画面へのリンク
 * （グレー + 常時下線）。
 */
export function RankHeading({
  rankSlug,
  status,
}: {
  readonly rankSlug: RankSlug;
  readonly status: RankStatus;
}) {
  const t = useTranslations("ranks");
  const router = useRouter();
  return (
    <View style={styles.row}>
      <BeltBadge slug={rankSlug} />
      <Text
        accessibilityRole="link"
        onPress={() => router.push(rankHref(rankSlug))}
        style={styles.title}
      >
        {t("heading", {
          rank: t(`names.${rankSlug}`),
          criterion: t(`criteria.${rankSlug}`),
        })}
      </Text>
      <RankStatusBadge status={status} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "700",
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
  },
});

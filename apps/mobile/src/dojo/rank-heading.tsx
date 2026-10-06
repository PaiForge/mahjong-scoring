import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import { ChevronRightIcon } from "../components/icons/icons";
import { colors } from "../lib/theme";
import { BeltBadge } from "./belt-badge";
import { RankStatusBadge } from "./rank-status-badge";

/**
 * 級カードの見出し行（web の `RankHeading`）
 * 段級位見出し
 *
 * 帯バッジ・「5級 — 満貫以上の点数計算ができること」・取得状態の pill を
 * 横に並べる。行全体が級の詳細画面への導線で、押せることは右端の矢印と
 * 押したときの薄れで示す（web は文に下線を引くが、ネイティブの行の定石に
 * 合わせる）。
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
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(rankHref(rankSlug))}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <BeltBadge slug={rankSlug} />
      <Text style={styles.title}>
        {t("heading", {
          rank: t(`names.${rankSlug}`),
          criterion: t(`criteria.${rankSlug}`),
        })}
      </Text>
      <RankStatusBadge status={status} />
      <ChevronRightIcon size={18} color={colors.surface400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
});

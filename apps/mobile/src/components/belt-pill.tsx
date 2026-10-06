import { StyleSheet, Text, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { RANK_BELT_COLORS } from "../lib/belt-colors";
import { colors } from "../lib/theme";
import { BeltIcon } from "./icons/icons";

/** 段級位のピル（web の `BeltPill` = 帯色の塗りに白抜きの帯アイコンと級名） */
export function BeltPill({
  slug,
  label,
}: {
  readonly slug: RankSlug;
  readonly label: string;
}) {
  return (
    <View
      style={[styles.pill, { backgroundColor: RANK_BELT_COLORS[slug].fill }]}
    >
      <BeltIcon size={14} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
});

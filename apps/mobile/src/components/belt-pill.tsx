import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { RANK_BELT_COLORS } from "../lib/belt-colors";
import { colors } from "../lib/theme";
import { BeltIcon } from "./icons/icons";

/**
 * 段級位のピル（web の `BeltPill` = 帯色の塗りに白抜きの帯アイコンと級名）
 *
 * `onPress` を渡すと押せるピルになる（web で `href` を渡したときと同じく、
 * その級の詳細へ送る）。押したときは少し薄くして押せたことを返す。
 */
export function BeltPill({
  slug,
  label,
  onPress,
  accessibilityLabel,
}: {
  readonly slug: RankSlug;
  readonly label: string;
  readonly onPress?: () => void;
  /** 押せるピルの読み上げ名（「4級の合格基準を見る」）。級名だけでは行き先が分からない */
  readonly accessibilityLabel?: string;
}) {
  const pillStyle = [
    styles.pill,
    { backgroundColor: RANK_BELT_COLORS[slug].fill },
  ];
  const content = (
    <>
      <BeltIcon size={14} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </>
  );
  if (onPress === undefined) return <View style={pillStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={8}
      style={({ pressed }) => [pillStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
});

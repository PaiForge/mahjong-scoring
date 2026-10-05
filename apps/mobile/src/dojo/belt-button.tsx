import { StyleSheet, Text, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { ChevronRightIcon } from "../components/icons/icons";
import { PressableSurface } from "../components/pressable-surface";
import { radius } from "../lib/theme";
import { beltStyle } from "./belt-style";

/**
 * 帯色のボタン（web の `buttonClasses({ variant: "belt" })` + 右シェブロン）
 * 帯色ボタン
 *
 * 面は帯色の淡い側、文字は淡い面に載せる濃い色、枠とハードシャドウは帯
 * そのものの色。級を掲げたカードの中で緑（押して始める面の色）を使うと、
 * 緑がその級の色に見えるため。右シェブロンなのは、押した先が試験の説明画面で
 * 押した瞬間に試験が始まるわけではないため。
 */
export function BeltButton({
  slug,
  onPress,
  children,
}: {
  readonly slug: RankSlug;
  readonly onPress: () => void;
  readonly children: string;
}) {
  const belt = beltStyle(slug);
  return (
    <PressableSurface
      onPress={onPress}
      shadowColor={belt.border}
      containerStyle={styles.container}
      style={[
        styles.face,
        { backgroundColor: belt.tint, borderColor: belt.border },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: belt.tintText }]}>{children}</Text>
        <ChevronRightIcon size={16} color={belt.tintText} />
      </View>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  face: {
    borderWidth: 3,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});

import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/**
 * アバター（web の `UserAvatar`）。画像が無ければ名前の頭文字
 * ユーザーアバター
 *
 * 太枠は付けない — 丸く回り込む枠は顔写真の縁を削る（web と同じ判断）。
 *
 * @param size - 直径（pt）。頭文字の大きさもこれに比例する
 */
export function UserAvatar({
  avatarUrl,
  name,
  size,
}: {
  readonly avatarUrl: string | undefined;
  readonly name: string;
  readonly size: number;
}) {
  const box = { width: size, height: size };
  if (avatarUrl !== undefined) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, box]}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  return (
    <View
      style={[styles.avatar, styles.fallback, box]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.375) }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: radius.full,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface100,
  },
  initial: {
    fontWeight: "700",
    color: colors.surface500,
  },
});

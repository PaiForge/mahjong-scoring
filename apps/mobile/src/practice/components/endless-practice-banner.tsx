import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ChevronRightIcon } from "../../components/icons/icons";
import { PressableSurface } from "../../components/pressable-surface";
import { colors, radius } from "../../lib/theme";

/**
 * 終わりのない練習（記録を取らない訓練）への導線バナー（web の `EndlessPracticeBanner`）
 * 訓練バナー
 *
 * 制限時間もミス上限もなく好きなだけ解ける訓練（総合演習・待ち別点数計算）は
 * 練習カードにせず、一覧の先頭にこのバナーで置く。カード全体が押せるので
 * 押せる面の記号（太枠 + ハードシャドウ + 押し込み）を持つ。
 */
export function EndlessPracticeBanner({
  href,
  emoji = "♾️",
  title,
  description,
}: {
  readonly href: string;
  /** 練習を表す絵文字（装飾。読み上げには載せない） */
  readonly emoji?: string;
  readonly title: string;
  readonly description: string;
}) {
  const router = useRouter();
  return (
    <PressableSurface
      onPress={() => router.push(href)}
      accessibilityLabel={title}
      style={styles.face}
    >
      <View style={styles.row}>
        <Text
          style={styles.emoji}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {emoji}
        </Text>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <ChevronRightIcon size={20} color={colors.surface400} />
      </View>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  face: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    backgroundColor: colors.white,
    padding: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emoji: {
    fontSize: 30,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface500,
  },
});

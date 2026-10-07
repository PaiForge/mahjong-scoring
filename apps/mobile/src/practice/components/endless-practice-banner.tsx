import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ChevronRightIcon } from "../../components/icons/icons";
import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";

/**
 * 終わりのない練習（記録を取らない訓練）への導線バナー（web の `EndlessPracticeBanner`）
 * 訓練バナー
 *
 * 制限時間もミス上限もなく好きなだけ解ける訓練（総合演習・待ち別点数計算）は
 * 練習カードにせず、一覧の先頭にこのバナーで置く。押すと説明画面へ移動する
 * だけで練習は始まらないので、練習カードと同じ細枠で影を持たない（web と同じ）。
 * 押せることは右端の矢印と押したときの地の色で示す。
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
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="link"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.face, pressed && styles.pressed]}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    ...panelFrame,
    padding: 20,
  },
  pressed: {
    backgroundColor: colors.surface50,
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

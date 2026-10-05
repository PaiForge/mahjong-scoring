import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { TextLink } from "../components/text-link";
import { colors, radius } from "../lib/theme";

/**
 * 切り上げ満貫適用中の但し書き（web の `KiriageManganNote`）
 * 切り上げ満貫の注記
 *
 * 表の 30符4翻・60符3翻は設定次第で満貫になる。表だけでは「点数表が間違っている」
 * と読めてしまうため、有効なときは表の下に明示して設定画面へ戻す。web の
 * `HighlightPanel`（琥珀色の囲み）と同じ見た目に描く。
 */
export function KiriageManganNote() {
  const t = useTranslations("scoreTable");
  const router = useRouter();

  return (
    <View style={styles.panel}>
      <Text style={styles.text}>{t("kiriageManganActive")}</Text>
      <TextLink onPress={() => router.push("/preferences")}>
        {t("kiriageManganActiveLink")}
      </TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 3,
    borderColor: colors.amber500,
    borderRadius: radius.lg,
    backgroundColor: colors.amber50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
    textAlign: "center",
  },
});

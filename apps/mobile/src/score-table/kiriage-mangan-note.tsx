import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { linkStyles } from "../lib/link-styles";
import { colors } from "../lib/theme";
import {
  PREFERENCE_ANCHORS,
  preferencesItemHref,
} from "@mahjong-scoring/features/settings/preference-anchors";

/**
 * 切り上げ満貫の設定の脚注（web の `KiriageManganNote`）
 * 切り上げ満貫の注記
 *
 * 表の 30符4翻・60符3翻は設定次第で満貫になる。表だけではどちらのルールで
 * 出ているか分からないため、オン・オフどちらでも表の下に今の設定を出して
 * 設定画面へ戻す。表の上のツモの注記と同じ淡い小さな文字の脚注にし、
 * リンクは文の中の語なので `linkStyles.inline` で示す。
 */
export function KiriageManganNote({ enabled }: { readonly enabled: boolean }) {
  const t = useTranslations("scoreTable");
  const router = useRouter();

  return (
    <Text style={styles.text}>
      {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      {"・"}
      <Text
        accessibilityRole="link"
        onPress={() =>
          router.push(preferencesItemHref(PREFERENCE_ANCHORS.kiriageMangan))
        }
        style={linkStyles.inline}
      >
        {t("kiriageManganStatusLink")}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.surface500,
  },
});

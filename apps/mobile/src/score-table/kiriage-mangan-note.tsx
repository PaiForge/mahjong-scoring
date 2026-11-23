import { StyleSheet, Text, View } from "react-native";
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
 * 設定画面へ戻す。表の上のツモの注記と同じ小さな文字の脚注にし、
 * リンクは同じ大きさの押せない語と 1 行に並ぶので、色だけでなく下線も持つ
 * `linkStyles.inline` で示す。状態の文字は本文と同じ `colors.foreground` にし、
 * 淡い灰にしない（web と同じ。地の文を淡くすると押せる語との違いが色の系統だけになる）。
 *
 * 表をシートに載せて開いている場合は、移動する前に `onLeave` でシートを
 * 閉じる。開いたままだと設定画面の上にシートが残る（用語シートと同じ）。
 *
 * 状態は左、リンクは右端に分けて置く（web と同じ）。以前は状態とリンクを中黒で
 * つないだ 1 行の文にしていたが、「なし・設定を変更」が同格の語の並びに見え、
 * どこからがリンクか分からなかった。
 */
export function KiriageManganNote({
  enabled,
  onLeave,
}: {
  readonly enabled: boolean;
  /** 設定画面へ移る直前に呼ぶ（表を載せたシートを閉じる） */
  readonly onLeave?: () => void;
}) {
  const t = useTranslations("scoreTable");
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.status]}>
        {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      </Text>
      <Text
        accessibilityRole="link"
        onPress={() => {
          onLeave?.();
          router.push(preferencesItemHref(PREFERENCE_ANCHORS.kiriageMangan));
        }}
        style={[styles.text, linkStyles.inline]}
      >
        {t("kiriageManganStatusLink")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: 12,
    rowGap: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 20,
  },
  status: {
    color: colors.foreground,
  },
});

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
 *
 * 表をシートに載せて開いている場合は、移動する前に `onLeave` でシートを
 * 閉じる。開いたままだと設定画面の上にシートが残る（用語シートと同じ）。
 *
 * 状態とリンクの間の区切りは web と同じ辞書キー
 * （`scoreTable.kiriageManganStatusSeparator`。日本語は中黒「・」、英語は中点「·」）
 * から引き、直書きしない。アプリは今は日本語だけで出しているが、約物を辞書に
 * 寄せておけば言語を足したときに日本語の約物が混ざらない。日本語の中黒は前後に
 * 空きを取らないため、web のような左右の余白は付けていない。
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
    <Text style={styles.text}>
      {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      {t("kiriageManganStatusSeparator")}
      <Text
        accessibilityRole="link"
        onPress={() => {
          onLeave?.();
          router.push(preferencesItemHref(PREFERENCE_ANCHORS.kiriageMangan));
        }}
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

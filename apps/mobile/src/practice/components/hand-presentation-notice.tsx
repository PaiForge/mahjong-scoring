import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { useHandPresentationNotice } from "@mahjong-scoring/features/board/use-hand-presentation";

import { colors } from "../../lib/theme";

/**
 * 手牌の見せ方を確かめられずに既定の向きで始めた案内
 * 手牌表示案内
 *
 * 練習のシェルが盤面の下に置く補足（盤面の外。盤面の寸法も、盤面をヘッダーの
 * 直下に付ける配置も変えない）。案内が無ければ何も描かない。失敗の知らせを
 * トーストに流さず画面に残し、確認のボタンや練習のやり直しは持たない。
 */
export function HandPresentationNotice() {
  const t = useTranslations("common");
  const show = useHandPresentationNotice();
  if (!show) return undefined;
  return (
    <Text style={styles.notice}>{t("handPresentationFallbackNotice")}</Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.surface500,
    textAlign: "center",
  },
});

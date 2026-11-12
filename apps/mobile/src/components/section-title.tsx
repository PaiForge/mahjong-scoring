import { StyleSheet, Text } from "react-native";

import { colors } from "../lib/theme";

/**
 * 節の見出し
 *
 * 太字の文字だけで出す（飾りを持たない）。ネイティブのアプリで見慣れた節の
 * 見出しの形（LINE のホームの「サービス」等・iOS の一覧の節）で、節の区切りは
 * 線ではなく、文字の大きさと上の余白で示す。大きさはタブの入口の見出し
 * （22pt。`HEADER_TAB_TITLE_STYLE`）より一段下、カードの中の題名（16〜17pt）より
 * 一段上。
 *
 * 却下: web の `SectionTitle` の形（左の短い緑の縦線・文字・右へ伸びる淡い横線）—
 * 以前はこれを写していた。web の記事の見出しの飾りで、アプリの中では web の
 * ページに見える。段級位の節には縦線に帯色を渡していたが、どの級かは見出しの
 * 級名と、直下のカードの帯色（`beltCardFrame`）が示す。
 */
export function SectionTitle({ children }: { readonly children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.text}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.foreground,
  },
});

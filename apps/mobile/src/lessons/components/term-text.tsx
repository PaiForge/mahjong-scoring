import { Fragment } from "react";
import { StyleSheet, Text } from "react-native";
import { parseTermMarkup } from "@mahjong-scoring/features/glossary/term-markup";

import { colors } from "../../lib/theme";

/**
 * 用語マークアップを解いた本文
 * 用語入り本文
 *
 * 辞書の本文の `[[slug|表示語]]` を表示語にする。web はここを用語集への
 * リンク（押すと用語の説明のモーダル）にするが、モバイルには用語集が
 * まだ無いので、表示語を一段濃い太字にして「用語」であることだけを示す
 * （押せるように見せない）。親の `<Text>` の中に置くこと。
 */
export function TermText({ children }: { readonly children: string }) {
  return (
    <>
      {parseTermMarkup(children).map((token, index) =>
        token.type === "text" ? (
          <Fragment key={index}>{token.value}</Fragment>
        ) : (
          <Text key={index} style={styles.term}>
            {token.label}
          </Text>
        ),
      )}
    </>
  );
}

const styles = StyleSheet.create({
  term: {
    fontWeight: "700",
    color: colors.surface900,
  },
});

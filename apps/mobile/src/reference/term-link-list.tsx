import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";

import { linkStyles } from "../lib/link-styles";

/**
 * 用語の名前を詰めて並べたリンク（web の分類インデックス・関連語の並び）
 * 用語リンク列
 *
 * 定義は置かず、語だけを折り返しながら並べて一覧性を優先する。リンクは
 * 単独の文字の操作なのでアクセント色の太字（下線なし）。
 *
 * 押したときは既定で用語のページを開く（`push`。用語集の一覧等から）。用語の
 * シートの中の「関連する用語」は、シートを積まずに中身を替えるので `onOpen` を
 * 渡す。
 */
export function TermLinkList({
  terms,
  onOpen,
}: {
  readonly terms: readonly GlossaryTermView[];
  /** 語を押したとき。省略すると用語のページを `push` で開く */
  readonly onOpen?: (term: GlossaryTermView) => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.list}>
      {terms.map((term) => (
        <Pressable
          key={term.slug}
          onPress={() => {
            if (onOpen === undefined) router.push(term.href);
            else onOpen(term);
          }}
          accessibilityRole="link"
          hitSlop={6}
        >
          {({ pressed }) => (
            <Text
              style={[
                styles.text,
                linkStyles.textButton,
                pressed && linkStyles.textButtonPressed,
              ]}
            >
              {term.term}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 10,
  },
  text: {
    fontSize: 15,
  },
});

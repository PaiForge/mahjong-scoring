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
 */
export function TermLinkList({
  terms,
}: {
  readonly terms: readonly GlossaryTermView[];
}) {
  const router = useRouter();
  return (
    <View style={styles.list}>
      {terms.map((term) => (
        <Pressable
          key={term.slug}
          onPress={() => router.push(term.href)}
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

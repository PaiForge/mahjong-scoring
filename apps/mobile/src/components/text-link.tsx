import { Pressable, StyleSheet, Text } from "react-native";

import { linkStyles } from "../lib/link-styles";

/**
 * 文字の操作（web の `TEXT_LINK_CLASSES` に当たる）
 * テキストリンク
 *
 * 「終了する」「一覧へ戻る」のように、面を持たずに置く操作。ネイティブの
 * 文字ボタンの定石どおりアクセント色の太字で、下線は引かない（体裁の理由は
 * `linkStyles`）。当たり判定は上下に広げて 44pt を確保する。
 */
export function TextLink({
  onPress,
  children,
  testID,
}: {
  readonly onPress: () => void;
  readonly children: string;
  /** Maestro のフローで引く印 */
  readonly testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="link"
      hitSlop={8}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.text,
            linkStyles.textButton,
            pressed && linkStyles.textButtonPressed,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 15,
    textAlign: "center",
  },
});

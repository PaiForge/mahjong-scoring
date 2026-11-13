import { StyleSheet, TextInput, View } from "react-native";

import { colors, radius } from "../lib/theme";
import { SymbolIcon } from "./icons/symbol-icon";

/**
 * 一覧を絞り込む検索欄
 * 検索欄
 *
 * 形はスマホ OS の検索欄（淡い灰の塗り・角丸・左に虫眼鏡・枠なし）。フォームの
 * 入力欄（`TextField`。ラベル + 枠）とは役割が違う — 送信するものではなく、
 * 打つそばから下の一覧が絞られる。消すボタンは iOS は OS のもの
 * （`clearButtonMode`）、Android には無いので打ち直す。
 *
 * OS のヘッダーの検索バー（`Stack.SearchBar`）にしないのは、ヘッダーの要素を
 * 画面が直接書かない決まり（`Screen`）と、iOS 26 では検索バーが画面下端へ移り、
 * 下の一覧・分類のチップと離れるため。
 */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  /** 何を探せるか。読み上げの名前にも使う */
  readonly placeholder: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.field}>
      <SymbolIcon name="search" size={16} color={colors.surface400} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.surface400}
        accessibilityLabel={placeholder}
        testID={testID}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface100,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    paddingVertical: 10,
  },
});

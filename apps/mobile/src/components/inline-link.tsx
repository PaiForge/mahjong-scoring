import { Pressable, StyleSheet, Text, View } from "react-native";

import { linkStyles } from "../lib/link-styles";
import { colors } from "../lib/theme";
import { ChevronRightIcon, CircleInfoIcon } from "./icons/icons";

/**
 * 押せない語と同じ大きさで並ぶ中に置く、押せる語（web の `TEXT_LINK_CLASSES`
 * を凡例・表のセルに当てている所）
 * 並びの中のリンク
 *
 * 結果画面の凡例の「不正解: N」や内訳の表の役名は、隣の「正解: N」や翻数と
 * 同じ大きさで同じ行・同じ表に並ぶ。ここではアクセント色だけでは押せる語を
 * 見分けられず、web は下線で示す。ネイティブの `Text` の下線は太さも位置も
 * 選べず（書体の細い線がベースラインに密着する）web の下線とは別物に見える
 * ので、下線ではなく、iOS・Android の定石どおり語の末尾の記号で示す。
 *
 * - `cue: "chevron"` — 押すとどこかへ移る語（「不正解: 2 ›」で間違えた問題へ）
 * - `cue: "info"` — 押すと説明が出る語（役名で役一覧が開く）
 *
 * 記号は添える文字の大きさに合わせ、文字と同じアクセント色で描く。
 * 自分の行を持つ文字の操作は {@link TextLink}、文の途中の語は
 * `linkStyles.inline`（折り返すので記号を添えられない）。
 */
export function InlineLink({
  onPress,
  children,
  cue,
  fontSize = 14,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: {
  readonly onPress: () => void;
  readonly children: string;
  readonly cue: "chevron" | "info";
  /** 添える文字の大きさ。記号もこれに合わせる */
  readonly fontSize?: number;
  readonly accessibilityLabel?: string;
  /** 押すと何が起きるか（「間違えた問題を見る」「役一覧で見る」） */
  readonly accessibilityHint?: string;
  /** Maestro のフローで引く印 */
  readonly testID?: string;
}) {
  const Cue = cue === "chevron" ? ChevronRightIcon : CircleInfoIcon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      hitSlop={8}
    >
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.pressed]}>
          <Text style={[{ fontSize }, linkStyles.textButton]}>{children}</Text>
          <Cue size={fontSize} color={colors.action} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});

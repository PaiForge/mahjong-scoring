import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

/** 式の 1 片。文字列はそのまま、`sup` は直前の片の右肩に小さく載せる */
export type FormulaPart = string | { readonly sup: string };

/**
 * ブロック数式（web の KaTeX の `BlockMath` の代わり）
 * 数式
 *
 * web は LaTeX を KaTeX で組むが、React Native には KaTeX が無い。点数の
 * 公式は「掛け算・累乗・矢印」しか使わないので、文字の並びと右肩の小さな
 * 指数だけで組む。行ごとに中央寄せで並べ、`aligned` の式は 1 行ずつ渡す。
 */
export function Formula({
  lines,
}: {
  readonly lines: readonly (readonly FormulaPart[])[];
}) {
  return (
    <View style={styles.block}>
      {lines.map((parts, lineIndex) => (
        <View key={lineIndex} style={styles.line}>
          {parts.map((part, index) =>
            typeof part === "string" ? (
              <Text key={index} style={styles.text}>
                {part}
              </Text>
            ) : (
              <Text key={index} style={styles.sup}>
                {part.sup}
              </Text>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  line: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.surface900,
  },
  sup: {
    fontSize: 11,
    lineHeight: 26,
    marginBottom: 9,
    color: colors.surface900,
  },
});

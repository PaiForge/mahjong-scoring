import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import type { TsumoPayment } from "@mahjong-scoring/core";

import { colors } from "../lib/theme";

/**
 * ツモ点数の2段表示（web の `TsumoScore`）
 * ツモ点数表示
 *
 * 狭い表で「400/700」を 1 行に収めきれず数字が割れるため、縦に積む。
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく ALL を添える。上下が何を指すかは表の上の凡例が受け持つ。
 */
export function TsumoScore({
  payment,
  textStyle,
}: {
  readonly payment: TsumoPayment;
  /** 数字の文字の体裁（色・太さ）。呼び出し側のセルに合わせる */
  readonly textStyle?: StyleProp<TextStyle>;
}) {
  if (payment.type === "koTsumo") {
    return (
      <View
        style={styles.stack}
        accessible
        accessibilityLabel={`${payment.fromKo}/${payment.fromOya}`}
      >
        <Text style={[styles.number, textStyle]}>{payment.fromKo}</Text>
        <View style={styles.rule} />
        <Text style={[styles.number, textStyle]}>{payment.fromOya}</Text>
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <Text style={[styles.number, textStyle]}>{payment.all}</Text>
      <Text style={[styles.all, textStyle]}>ALL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: "stretch",
  },
  center: {
    alignItems: "center",
  },
  number: {
    textAlign: "center",
    lineHeight: 17,
  },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: 2,
    // 数字と同じ色（点数表の数字の緑）を薄く敷く
    backgroundColor: colors.primary600,
    opacity: 0.3,
  },
  all: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    opacity: 0.6,
    textAlign: "center",
  },
});

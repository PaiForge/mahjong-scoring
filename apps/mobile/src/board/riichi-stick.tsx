import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

import { colors } from "../lib/theme";

/** リーチ棒（web の `RiichiStick` = 名札と白い棒に赤い点） */
export function RiichiStick({ label }: { readonly label: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Svg width={54} height={10} viewBox="0 0 54 10">
        <Rect width={54} height={10} rx={3} fill={colors.white} />
        <Circle cx={27} cy={5} r={2.2} fill={colors.destructive} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  label: {
    marginBottom: 2,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
    color: "rgba(255,255,255,0.7)",
  },
});

import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

/**
 * 破線の区切り（web の `border-dashed border-border/40`）
 *
 * React Native の `borderStyle: "dashed"` は iOS で片側だけの枠に効かないため、
 * 線を svg で引く。
 */
export function DashedDivider({
  thickness = 1,
}: {
  readonly thickness?: number;
}) {
  return (
    <View style={{ height: thickness, alignSelf: "stretch" }}>
      <Svg width="100%" height={thickness}>
        <Line
          x1={0}
          y1={thickness / 2}
          x2="100%"
          y2={thickness / 2}
          stroke="rgba(47, 107, 79, 0.4)"
          strokeWidth={thickness}
          strokeDasharray={thickness > 1 ? "6 4" : "4 3"}
        />
      </Svg>
    </View>
  );
}

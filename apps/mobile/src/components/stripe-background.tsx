import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";

/**
 * 地の斜線（web の body の `repeating-linear-gradient(45deg, …)`）
 *
 * 14px の淡い ink の帯と 14px の透明を 45° で繰り返す。見出しの帯の背景に敷く。
 * svg の大きさは親の実寸を測って渡す（% 指定は web 版の react-native-svg で
 * 既定の 300×150 に落ちることがある）。
 */
export function StripeBackground() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // 45° の帯の周期（14px + 14px）を水平方向に測った幅
  const period = 28 * Math.SQRT2;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <Pattern
              id="stripe"
              patternUnits="userSpaceOnUse"
              width={period}
              height={period}
            >
              <Path
                d={`M0 ${period / 2} L${period / 2} 0 L${period} 0 L0 ${period} Z M${period / 2} ${period} L${period} ${period / 2} L${period} ${period} Z`}
                fill="rgba(47, 107, 79, 0.05)"
              />
            </Pattern>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="url(#stripe)"
          />
        </Svg>
      )}
    </View>
  );
}

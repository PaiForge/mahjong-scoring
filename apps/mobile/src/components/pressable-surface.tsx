import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, shadowOffset } from "../lib/theme";

interface PressableSurfaceProps {
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  /** 面の見た目（枠・塗り・角丸・余白）。角丸は影にも写す */
  readonly style?: StyleProp<ViewStyle>;
  /** 外側の箱のレイアウト（幅・外側の余白） */
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly shadow?: keyof typeof shadowOffset;
  /** 影の色（既定は ink） */
  readonly shadowColor?: string;
  readonly accessibilityLabel?: string;
  readonly accessibilityState?: { readonly selected?: boolean };
  readonly testID?: string;
  readonly children: ReactNode;
}

/**
 * 押せる面 — ハードシャドウと押し込み演出
 * 押せる面
 *
 * web の `press-sm shadow-sm`（右下へ 3px ずれた ink の影。押すと面が影の
 * 位置まで沈み、影が消える）を再現する。iOS の shadow は radius 0 で描けるが
 * Android の elevation は硬い影を描けないため、影は面の後ろに敷いた同じ形の
 * View で描く（両プラットフォームで同じ見た目になる）。
 *
 * 無効なときは影を落とし、押し込みもしない（web の `buttonClasses` の
 * disabled と同じ — 押せないものに「押せる」の記号を付けない）。
 */
export function PressableSurface({
  onPress,
  disabled = false,
  style,
  containerStyle,
  shadow = "sm",
  shadowColor = colors.ink,
  accessibilityLabel,
  accessibilityState,
  testID,
  children,
}: PressableSurfaceProps) {
  const [pressed, setPressed] = useState(false);
  const offset = shadowOffset[shadow];
  const flat = StyleSheet.flatten(style);
  const borderRadius = flat?.borderRadius ?? 0;
  const sunk = pressed && !disabled;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      style={[{ paddingRight: offset, paddingBottom: offset }, containerStyle]}
    >
      {!disabled && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: offset,
            left: offset,
            right: 0,
            bottom: 0,
            borderRadius,
            backgroundColor: shadowColor,
          }}
        />
      )}
      <View
        style={[
          style,
          sunk && {
            transform: [{ translateX: offset }, { translateY: offset }],
          },
        ]}
      >
        {children}
      </View>
    </Pressable>
  );
}

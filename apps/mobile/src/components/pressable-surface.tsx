import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

interface PressableSurfaceProps {
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  /** 面の見た目とレイアウト（枠・塗り・角丸・余白・幅） */
  readonly style?: StyleProp<ViewStyle>;
  /**
   * 押している間だけ重ねる見た目（塗りと枠の色）。位置・大きさは変えない。
   * 無効なときは重ねない
   */
  readonly pressedStyle: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
  readonly accessibilityState?: { readonly selected?: boolean };
  readonly testID?: string;
  readonly children: ReactNode;
}

/**
 * 押せる面 — 押している間だけ色が変わる
 * 押せる面
 *
 * web の `buttonClasses()` / `ChoiceButton` と同じフラットな面: 影を持たず、
 * 押しても位置を動かさない（web の hover / active が色だけを変えるのと同じ）。
 * 押したことは `pressedStyle`（一段濃い塗り・枠）で示す。押せることは
 * 塗り（緑・帯色）と枠の色で示し、押せる面だけの記号（影・押し込み）は持たない。
 */
export function PressableSurface({
  onPress,
  disabled = false,
  style,
  pressedStyle,
  accessibilityLabel,
  accessibilityState,
  testID,
  children,
}: PressableSurfaceProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      style={({ pressed }) => [style, pressed && !disabled && pressedStyle]}
    >
      {children}
    </Pressable>
  );
}

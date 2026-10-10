import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { borderWidth, colors, radius } from "../lib/theme";
import { PressableSurface } from "./pressable-surface";

/** 塗り・文字色の系統（web の `ButtonVariant` のうちモバイルで使うもの） */
export type ButtonVariant = "primary" | "secondary" | "neutral" | "danger";

/** 大きさ（web の `ButtonSize` と同じ段階） */
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  /** ラベルの前に置くアイコン（色は呼び出し側が文字色に合わせる） */
  readonly icon?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly children: string;
}

interface ButtonFill {
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
  /** 押している間の塗りと枠（web の active / hover） */
  readonly pressedBg: string;
  readonly pressedBorder: string;
}

/**
 * 塗りのボタン（primary / danger）は枠を塗りと同化させる（透明）。淡色の
 * 細い枠を緑の上に引くと縁だけが白っぽく浮いて見える。幅は他の variant と
 * 同じ 1px を保つ。
 */
const FILL: Record<ButtonVariant, ButtonFill> = {
  primary: {
    bg: colors.primary500,
    fg: colors.white,
    border: "transparent",
    pressedBg: colors.primary700,
    pressedBorder: "transparent",
  },
  secondary: {
    bg: colors.card,
    fg: colors.primary700,
    border: colors.panel,
    pressedBg: colors.primary100,
    pressedBorder: colors.primary300,
  },
  neutral: {
    bg: colors.card,
    fg: colors.surface700,
    border: colors.panel,
    pressedBg: colors.surface200,
    pressedBorder: colors.surface300,
  },
  danger: {
    bg: colors.destructive,
    fg: colors.white,
    border: "transparent",
    pressedBg: colors.destructiveStrong,
    pressedBorder: "transparent",
  },
};

const PADDING: Record<ButtonSize, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8 },
  md: { paddingHorizontal: 24, paddingVertical: 11 },
  lg: { paddingHorizontal: 24, paddingVertical: 14 },
};

/** 文字の大きさ。スマホの標準（本文 15〜17pt）に合わせ、面の大きさと一緒に段を付ける */
const FONT_SIZE: Record<ButtonSize, number> = {
  sm: 14,
  md: 15,
  lg: 16,
};

/** ボタンの文字色（アイコンの色を合わせるために公開する） */
export function buttonForeground(
  variant: ButtonVariant = "primary",
  disabled = false,
): string {
  return disabled ? colors.surface400 : FILL[variant].fg;
}

/**
 * ボタン
 *
 * web の `Button` / `LinkButton`（`buttonClasses()`）と同じ見た目:
 * 塗り + 1px の枠。影は持たず、押している間は塗りが一段濃くなるだけで
 * 位置は動かない。色・枠は variant で決め、`style` はレイアウト（外側の
 * 余白など）だけに使う。
 */
export function Button({
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  icon,
  style,
  testID,
  children,
}: ButtonProps) {
  const fill = FILL[variant];
  return (
    <PressableSurface
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.face,
        PADDING[size],
        disabled
          ? styles.disabled
          : { backgroundColor: fill.bg, borderColor: fill.border },
        fullWidth && { alignSelf: "stretch" },
        style,
      ]}
      pressedStyle={{
        backgroundColor: fill.pressedBg,
        borderColor: fill.pressedBorder,
      }}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.label,
            {
              fontSize: FONT_SIZE[size],
              color: buttonForeground(variant, disabled),
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  face: {
    borderWidth: borderWidth.panel,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontWeight: "700",
  },
  disabled: {
    backgroundColor: colors.surface100,
    borderColor: colors.surface200,
  },
});

import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius } from "../lib/theme";
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

const FILL: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.primary500, fg: colors.white },
  secondary: { bg: colors.card, fg: colors.primary700 },
  neutral: { bg: colors.card, fg: colors.surface700 },
  danger: { bg: colors.destructive, fg: colors.white },
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
 * 太枠（3px・ink）+ ハードシャドウ + 押し込み。色・枠・影は variant で決め、
 * `style` はレイアウト（外側の余白など）だけに使う。
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
      containerStyle={[fullWidth && { alignSelf: "stretch" }, style]}
      style={[
        styles.face,
        PADDING[size],
        disabled
          ? styles.disabled
          : { backgroundColor: fill.bg, borderColor: colors.ink },
      ]}
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
    borderWidth: 3,
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
    backgroundColor: colors.surface200,
    borderColor: colors.ink,
    opacity: 0.6,
  },
});

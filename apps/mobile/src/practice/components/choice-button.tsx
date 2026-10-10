import { memo, useCallback, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { PressableSurface } from "../../components/pressable-surface";
import { borderWidth, colors, radius } from "../../lib/theme";

interface ChoiceButtonProps {
  readonly index: number;
  readonly onSelect: (index: number) => void;
  readonly disabled: boolean;
  /** 正誤の配色（`choiceFeedbackProps` の `feedbackStyle`） */
  readonly feedbackStyle: ViewStyle;
  /** 面のレイアウト（グリッドの幅・中の並び等） */
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
  readonly children: ReactNode;
}

/**
 * 選択肢ボタン（web の `ChoiceButton` = 1px の枠 + 押している間の塗り）
 *
 * 枠はフォーム部品と同じ一段濃い灰（`choiceFeedbackStyle`）。無効
 * （フィードバック中）でも正誤の色を読ませるため、面はそのまま残す。
 */
export const ChoiceButton = memo(function ChoiceButtonComponent({
  index,
  onSelect,
  disabled,
  feedbackStyle,
  style,
  accessibilityLabel,
  children,
}: ChoiceButtonProps) {
  const handlePress = useCallback(() => onSelect(index), [onSelect, index]);
  return (
    <PressableSurface
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={`choice-${index}`}
      style={[styles.face, feedbackStyle, style]}
      pressedStyle={styles.pressed}
    >
      {children}
    </PressableSurface>
  );
});

const styles = StyleSheet.create({
  face: {
    borderWidth: borderWidth.panel,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
  },
});

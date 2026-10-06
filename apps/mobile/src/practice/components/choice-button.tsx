import { memo, useCallback, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { PressableSurface } from "../../components/pressable-surface";
import { radius } from "../../lib/theme";

interface ChoiceButtonProps {
  readonly index: number;
  readonly onSelect: (index: number) => void;
  readonly disabled: boolean;
  /** 正誤の配色（`choiceFeedbackProps` の `feedbackStyle`） */
  readonly feedbackStyle: ViewStyle;
  /** 外側の箱のレイアウト（グリッドの幅など） */
  readonly containerStyle?: StyleProp<ViewStyle>;
  /** 面の中の並び（縦積み等） */
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
  readonly children: ReactNode;
}

/**
 * 選択肢ボタン（web の `ChoiceButton` = 太枠・ハードシャドウ・押し込み）
 *
 * 選択肢は押せる面なので影を持つ。無効（フィードバック中）でも正誤の色を
 * 読ませるため、影を落とすだけで面は残す。
 */
export const ChoiceButton = memo(function ChoiceButtonComponent({
  index,
  onSelect,
  disabled,
  feedbackStyle,
  containerStyle,
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
      containerStyle={containerStyle}
      style={[styles.face, feedbackStyle, style]}
    >
      {children}
    </PressableSurface>
  );
});

const styles = StyleSheet.create({
  face: {
    borderWidth: 3,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

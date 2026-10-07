import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { colors, radius } from "../lib/theme";
import type { SelectOption } from "./select-option-list";

interface SelectValueBoxProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  /** 何も選ばれていないときに出す文言 */
  readonly placeholder: string;
  readonly disabled?: boolean;
  /** チップの × を押したときの解除。省略すると × を出さない */
  readonly onRemove?: (value: string) => void;
  /**
   * 枠線と背景（既定: 白地に ink の枠）
   *
   * 回答の正誤を箱の色で示す練習が、フィードバック中だけ差し替える。
   * 渡すと disabled の灰色にも勝つ。
   */
  readonly frameStyle?: ViewStyle;
}

/**
 * 選択済みの値をチップで並べる箱（web の `SelectValueBox`）
 * 選択値の箱
 *
 * 選択肢を常に出している欄の「選択中」の行。モバイルにはまだモーダルを
 * 開く選択欄が無いため、web の `onOpen`（＋で開く）は持たない。
 */
export function SelectValueBox({
  options,
  value,
  placeholder,
  disabled = false,
  onRemove,
  frameStyle,
}: SelectValueBoxProps) {
  const labelOf = (val: string) =>
    options.find((option) => option.value === val)?.label ?? val;

  return (
    <View
      style={[
        styles.box,
        frameStyle ?? (disabled ? styles.boxDisabled : styles.boxEnabled),
      ]}
    >
      {value.length > 0 ? (
        value.map((v) => (
          <View key={v} style={styles.chip}>
            <Text style={styles.chipLabel}>{labelOf(v)}</Text>
            {/* 無効中は × を押せなくするが幅は残す（消すと折り返しが変わり、
                回答した瞬間に箱の高さが変わる） */}
            {onRemove && (
              <Pressable
                onPress={() => onRemove(v)}
                disabled={disabled}
                hitSlop={8}
                accessibilityElementsHidden={disabled}
                importantForAccessibility={
                  disabled ? "no-hide-descendants" : "auto"
                }
                style={disabled ? styles.removeHidden : undefined}
              >
                <Text style={styles.remove}>{"×"}</Text>
              </Pressable>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 46,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    borderWidth: 3,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  boxEnabled: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  boxDisabled: {
    borderColor: colors.ink,
    backgroundColor: colors.surface100,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipLabel: {
    fontSize: 14,
    color: colors.primary800,
  },
  remove: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary600,
  },
  removeHidden: {
    opacity: 0,
  },
  placeholder: {
    paddingHorizontal: 4,
    fontSize: 14,
    color: colors.surface400,
  },
});

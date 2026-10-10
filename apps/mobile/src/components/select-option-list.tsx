import { Fragment, type Ref } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius } from "../lib/theme";
import { Divider } from "./divider";

/** 選択肢 1 件 */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectOptionListProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  readonly onToggle: (value: string) => void;
  readonly disabled?: boolean;
  /** 読み上げ用の一覧名（「役を選択」など） */
  readonly label: string;
  /** 枠の高さなど（囲みと配色は上書きしない） */
  readonly style?: StyleProp<ViewStyle>;
  /** スクロール位置を操作するための枠への参照 */
  readonly ref?: Ref<ScrollView>;
}

/**
 * 選択肢を並べたスクロール一覧（web の `SelectOptionList`）
 * 選択肢一覧
 *
 * 枠の中で一覧自身がスクロールし、外側の高さは呼び出し側が決める。行は
 * 細い実線で区切り、選んだ行は薄い緑の地にチェックを付ける。
 */
export function SelectOptionList({
  options,
  value,
  onToggle,
  disabled = false,
  label,
  style,
  ref,
}: SelectOptionListProps) {
  return (
    <ScrollView
      ref={ref}
      style={[styles.frame, style]}
      nestedScrollEnabled
      accessibilityLabel={label}
    >
      {options.map((option, i) => {
        const isSelected = value.includes(option.value);
        return (
          <Fragment key={option.value}>
            {i > 0 && <Divider tone="row" />}
            <Pressable
              onPress={() => onToggle(option.value)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled }}
              style={({ pressed }) => [
                styles.row,
                isSelected
                  ? styles.rowSelected
                  : pressed && !disabled
                    ? styles.rowPressed
                    : undefined,
              ]}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label}
              </Text>
              {isSelected && <Text style={styles.check}>{"✓"}</Text>}
            </Pressable>
          </Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowSelected: {
    backgroundColor: colors.selectedSubtle,
  },
  rowPressed: {
    backgroundColor: colors.surface50,
  },
  label: {
    fontSize: 14,
    color: colors.surface700,
  },
  labelSelected: {
    fontWeight: "500",
    color: colors.foreground,
  },
  check: {
    fontSize: 18,
    lineHeight: 20,
    color: colors.foreground,
  },
});

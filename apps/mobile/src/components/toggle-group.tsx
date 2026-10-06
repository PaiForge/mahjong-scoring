import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/** トグルの選択肢 */
export interface ToggleOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface ToggleGroupProps<T extends string> {
  /** 選択肢のまとまり。まとまりの間に細い縦線を引く */
  readonly groups: readonly (readonly ToggleOption<T>[])[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
  readonly accessibilityLabel?: string;
}

/**
 * 1 つを選ぶセグメントコントロール（web の点数表の `ToggleGroup`）
 * セグメントコントロール
 *
 * 2〜3 択の表示切り替え（親 / 子、ロン / ツモ、符翻 / 満貫以上）に使う。
 * スマホ OS 標準のセグメントコントロールと同じ形: 淡いグレーの溝に選択肢を
 * 並べ、選んだものだけ白い面で浮かせる。一覧の絞り込みのように選択肢が
 * 多く横に流すものは `FilterChips` を使う。
 */
export function ToggleGroup<T extends string>({
  groups,
  selected,
  onSelect,
  accessibilityLabel,
}: ToggleGroupProps<T>) {
  const options = groups.flat();
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface100,
    padding: 2,
  },
  segment: {
    minHeight: 30,
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.surface600,
  },
  labelActive: {
    color: colors.foreground,
  },
});

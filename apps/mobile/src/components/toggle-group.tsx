import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";

/** トグルの選択肢 */
export interface ToggleOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface ToggleGroupProps<T extends string> {
  /** 選択肢のまとまり。まとまりの間に縦線を引く */
  readonly groups: readonly (readonly ToggleOption<T>[])[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
  readonly accessibilityLabel?: string;
}

/**
 * 1 つを選ぶトグル（web の `ToggleGroup` / 練習一覧の絞り込み）
 *
 * 太枠の pill の中に選択肢を並べ、選んだものを濃い緑に白抜きにする。
 * 画面幅に収まらないときは横にスクロールする。
 */
export function ToggleGroup<T extends string>({
  groups,
  selected,
  onSelect,
  accessibilityLabel,
}: ToggleGroupProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.container} accessibilityRole="radiogroup">
        {groups.map((group, gi) => (
          <Fragment key={gi}>
            {gi > 0 && <View style={styles.separator} />}
            {group.map((option) => {
              const isActive = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.item, isActive && styles.itemActive]}
                >
                  <Text style={[styles.label, isActive && styles.labelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.primary50,
    borderRadius: 9999,
    padding: 3,
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: colors.primary200,
  },
  item: {
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  itemActive: {
    backgroundColor: colors.primary700,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface700,
  },
  labelActive: {
    color: colors.white,
  },
});

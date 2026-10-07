import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/** チップ 1 つ */
export interface FilterChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface FilterChipsProps<T extends string> {
  /** 選択肢のまとまり（「すべて」/ 段級位 / 分野）。並びは続けて流す */
  readonly groups: readonly (readonly FilterChipOption<T>[])[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
  readonly accessibilityLabel?: string;
}

/** 画面の左右の余白（`Screen` の本文の `paddingHorizontal`）。チップの列はこの外まで流す */
const SCREEN_GUTTER = 16;

/**
 * 絞り込みのチップの列（web の練習一覧の絞り込み）
 * 絞り込みチップ
 *
 * 一覧の絞り込みに使う。web は 1 つの細枠の溝に選択肢を詰めて 1 行に収めるが、
 * それが収まるのは文字が 12px・押せる高さが 30px と小さいため。モバイルの
 * 本文の大きさで並べると画面からはみ出し、溝のまま横にスクロールさせると枠の
 * 端が途中で切れて見える。そこで形はスマホアプリの定石（独立したチップを
 * 横 1 列に並べ、画面の端まで流す）にし、色だけ web の値を写す: 選んだチップは
 * 緑の地に白抜き、それ以外は淡い灰色の地に細枠と灰色の文字。
 *
 * 2〜3 択の表示切り替え（親 / 子、ロン / ツモ）は {@link ToggleGroup}
 * （セグメントコントロール）を使う。
 */
export function FilterChips<T extends string>({
  groups,
  selected,
  onSelect,
  accessibilityLabel,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <View style={styles.row} accessibilityRole="radiogroup">
        {groups.map((group, gi) => (
          <Fragment key={gi}>
            {group.map((option) => {
              const isActive = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && !isActive && styles.chipPressed,
                  ]}
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
    marginHorizontal: -SCREEN_GUTTER,
  },
  content: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.panel,
    backgroundColor: colors.surface50,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: colors.primary700,
    backgroundColor: colors.primary700,
  },
  chipPressed: {
    backgroundColor: colors.surface100,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface500,
  },
  labelActive: {
    color: colors.white,
  },
});

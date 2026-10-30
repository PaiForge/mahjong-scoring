import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/** トグルの選択肢 */
export interface ToggleOption<T extends string> {
  readonly value: T;
  /**
   * 文言。文字列なら選択状態に応じた色の Text で描く。文言にバッジを
   * 添えるなど自前で描くときは要素を渡し、文字色は {@link toggleLabelColor} で
   * 選択状態に合わせる
   */
  readonly label: string | ReactNode;
}

interface ToggleGroupProps<T extends string> {
  /** 選択肢のまとまり。続けて 1 列に並べる */
  readonly groups: readonly (readonly ToggleOption<T>[])[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
  readonly accessibilityLabel?: string;
  /**
   * 選択肢を溝の幅いっぱいに均等に広げる（画面の表示そのものを切り替える
   * 上段の切り替え。web の練習一覧の「基礎練習 / 実戦練習」と同じ）。既定は
   * 文言の幅に詰める
   */
  readonly fill?: boolean;
  /**
   * 高さ。既定の `sm` は見出しの横や表の上に置く 34pt。`lg` は回答の欄の中で
   * 指で押す 44pt（点数のタイル入力の「満貫未満 / 満貫以上」）
   */
  readonly size?: "sm" | "lg";
  /** 切り替えを受け付けない（回答直後の正誤を見せている間など）。見た目は変えない */
  readonly disabled?: boolean;
  /** Maestro のフローで引く印。選択肢ごとに `<testID>-<値>` を付ける */
  readonly testID?: string;
}

/**
 * 選択肢の文字色（選択中は緑の地に白、それ以外は灰色）
 *
 * 文言を要素で渡す呼び出し側（文言にバッジを添えるもの）が、文字とバッジの
 * 色を {@link ToggleGroup} と揃えるために使う。
 */
export function toggleLabelColor(isActive: boolean): string {
  return isActive ? colors.white : colors.surface500;
}

/**
 * 1 つを選ぶセグメントコントロール（web の `ToggleGroup`）
 * セグメントコントロール
 *
 * 2〜3 択の表示切り替え（親 / 子、ロン / ツモ、符翻 / 満貫以上、基礎 / 実戦）に
 * 使う。形はスマホ OS 標準のセグメントコントロール（溝に選択肢を並べる）で、
 * 色は web の値を写す: 細枠の淡い溝に、選んだものだけ緑の地に白抜き（緑 =
 * 今選んでいるもの）。一覧の絞り込みのように選択肢が多く横に流すものは
 * `FilterChips` を使う。
 */
export function ToggleGroup<T extends string>({
  groups,
  selected,
  onSelect,
  accessibilityLabel,
  fill = false,
  size = "sm",
  disabled = false,
  testID,
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
            disabled={disabled}
            testID={
              testID === undefined ? undefined : `${testID}-${option.value}`
            }
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive, disabled }}
            style={[
              styles.segment,
              size === "lg" && styles.segmentLg,
              fill && styles.segmentFill,
              isActive && styles.segmentActive,
            ]}
          >
            {typeof option.label === "string" ? (
              <Text
                style={[
                  styles.label,
                  size === "lg" && styles.labelLg,
                  isActive && styles.labelActive,
                ]}
              >
                {option.label}
              </Text>
            ) : (
              option.label
            )}
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
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.md,
    backgroundColor: colors.surface50,
    padding: 2,
  },
  segment: {
    minHeight: 30,
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  // 溝の padding 2 を足して 44pt
  segmentLg: {
    minHeight: 40,
  },
  segmentFill: {
    flex: 1,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.selected,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: toggleLabelColor(false),
  },
  labelLg: {
    fontSize: 14,
  },
  labelActive: {
    color: toggleLabelColor(true),
  },
});

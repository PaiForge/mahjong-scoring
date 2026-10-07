import { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useTranslations } from "use-intl";
import type { MentsuJantouFuItem } from "@mahjong-scoring/core";
import { FU_OPTIONS } from "@mahjong-scoring/features/practice/fu-options";

import { Grid } from "../../../components/grid";
import { colors, radius } from "../../../lib/theme";
import { FuItemTiles } from "./fu-item-tiles";

/**
 * 選んだ（まだ答え合わせ前の）符の配色
 *
 * web は Tailwind 既定パレットの青（`border-blue-500 bg-blue-100
 * text-blue-700`）で示す。ブランドのトークンに無い色なのでここに写す。
 */
const SELECTED_COLORS = {
  border: "#3b82f6",
  background: "#dbeafe",
  text: "#1d4ed8",
} as const;

interface FuItemRowProps {
  readonly index: number;
  readonly item: MentsuJantouFuItem;
  /** この行で選んだ符（未選択は undefined） */
  readonly answer: number | undefined;
  readonly showFeedback: boolean;
  /**
   * 「わからない」で正解を開示中か
   *
   * 無回答のまま showFeedback が立つため、そのままだと全行が誤答の赤になる。
   * 開示中は誤答の演出を出さず、正解の符だけを示す。
   */
  readonly isRevealed?: boolean;
  readonly isCountingDown: boolean;
  /**
   * 和了牌として枠を付ける牌の位置（この要素で和了していなければ undefined）
   *
   * 手牌表示で和了牌に付けるのと同じ枠を、回答行の牌にも付ける。
   */
  readonly highlightedTileIndex?: number;
  readonly onSelect: (index: number, value: number) => void;
}

/** 符ボタン 1 つの配色（web の `FuItemRow` の分岐と同じ順） */
function optionColors(params: {
  readonly option: number;
  readonly fu: number;
  readonly isSelected: boolean;
  readonly isCorrect: boolean;
  readonly showFeedback: boolean;
  readonly isRevealed: boolean;
}): { readonly box: ViewStyle; readonly text: TextStyle } {
  const { option, fu, isSelected, isCorrect, showFeedback, isRevealed } =
    params;
  const correctColors = {
    box: { borderColor: colors.primary500, backgroundColor: colors.primary50 },
    text: { color: colors.primary700 },
  };
  const plainColors = {
    box: { borderColor: colors.surface200, backgroundColor: colors.white },
    text: { color: colors.surface600 },
  };
  // 開示中は選択が無いため、正解の符のボタンを正解色で示す
  if (isRevealed) return option === fu ? correctColors : plainColors;
  if (showFeedback && isSelected) {
    return isCorrect
      ? correctColors
      : {
          box: {
            borderColor: colors.destructive,
            backgroundColor: colors.destructiveSubtle,
          },
          text: { color: colors.destructiveStrong },
        };
  }
  if (isSelected) {
    return {
      box: {
        borderColor: SELECTED_COLORS.border,
        backgroundColor: SELECTED_COLORS.background,
      },
      text: { color: SELECTED_COLORS.text },
    };
  }
  return plainColors;
}

/**
 * 符計算の個別要素行
 * 符要素行
 *
 * web の `FuItemRow` の移植。面子（雀頭）の牌と、その下に全幅で並べた符の
 * 選択肢。答え合わせでは行の枠を正誤の色にし、誤答なら正解の符を添える。
 */
export const FuItemRow = memo(function FuItemRowComponent({
  index,
  item,
  answer,
  showFeedback,
  isRevealed = false,
  isCountingDown,
  highlightedTileIndex,
  onSelect,
}: FuItemRowProps) {
  const t = useTranslations("mentsuJantouFu");
  const isCorrect = showFeedback && !isRevealed && answer === item.fu;
  const isWrong = showFeedback && !isRevealed && answer !== item.fu;
  const disabled = showFeedback || isCountingDown;

  return (
    <View
      style={[
        styles.row,
        !showFeedback || isRevealed
          ? styles.rowPlain
          : isCorrect
            ? styles.rowCorrect
            : styles.rowWrong,
      ]}
    >
      {/* 面子の牌（左）と、誤答時の正解表示（右） */}
      <View style={styles.head}>
        <FuItemTiles item={item} highlightedTileIndex={highlightedTileIndex} />
        {(isWrong || isRevealed) && (
          <Text
            style={[
              styles.correctAnswer,
              { color: isRevealed ? colors.surface600 : colors.destructive },
            ]}
          >
            {t("correctAnswer", { fu: item.fu })}
          </Text>
        )}
      </View>

      {/* 符の選択肢。牌の下に全幅で並べ、タップしやすい大きさにする */}
      <Grid columns={FU_OPTIONS.length} gap={6}>
        {FU_OPTIONS.map((option) => {
          const { box, text } = optionColors({
            option,
            fu: item.fu,
            isSelected: answer === option,
            isCorrect,
            showFeedback,
            isRevealed,
          });
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(index, option)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: answer === option }}
              testID={`fu-item-${index}-${option}`}
              style={[styles.option, box, disabled && styles.disabled]}
            >
              <Text style={[styles.optionLabel, text]}>{option}</Text>
            </Pressable>
          );
        })}
      </Grid>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.panel,
    padding: 12,
  },
  rowPlain: {
    borderColor: colors.surface200,
    backgroundColor: colors.white,
  },
  rowCorrect: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  rowWrong: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  correctAnswer: {
    marginLeft: "auto",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "700",
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});

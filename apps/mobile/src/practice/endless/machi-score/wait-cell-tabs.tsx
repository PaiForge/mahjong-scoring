import { Hai } from "@pai-forge/mahjong-react-ui";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { JudgementResult } from "@mahjong-scoring/core";
import { haiIdToMpsz } from "@mahjong-scoring/core";
import {
  cellKeyOf,
  type MachiCellRef,
} from "@mahjong-scoring/features/practice/machi-score/cell-ref";

import { colors, radius } from "../../../lib/theme";
import { JudgementMark } from "../../components/judgement-mark";

/** パネルの上枠の太さ。選択中のタブがこの分だけ下へ伸びて枠を覆う */
export const PANEL_BORDER = 3;

/**
 * タブの地（web の `tabTone`）
 *
 * 選択中のタブは下のパネルと同じ白にして地続きに見せる。選択していない
 * タブは正誤の色で塗り、判定が無い（「わからない」での開示）ときは中立の灰。
 */
function tabBackground(
  verdict: "correct" | "incorrect" | undefined,
  isSelected: boolean,
): string {
  if (isSelected) return colors.white;
  if (verdict === undefined) return colors.surface200;
  return verdict === "correct"
    ? colors.successSubtle
    : colors.destructiveSubtle;
}

/**
 * 待ち × ツモ/ロン のマスを切り替えるタブ（web の `WaitCellTabs`）
 * 待ちマスタブ
 *
 * タブごとに正解の点数を添え、タブの列を左から読むだけで「待ちによって
 * 点数がどう変わるか」が並んで見えるようにする。自分の回答と内訳は選んだ
 * タブの下のパネルが持つ。選択中のタブはパネルの上枠を覆って 1 枚に
 * つながって見せる。多面待ちでタブが溢れたら横スクロール（理由は web の TSDoc）。
 */
export function WaitCellTabs({
  cells,
  cellResults,
  focused,
  onFocusCell,
  correctAnswerLinesOf,
}: {
  /** タブに並べるマス（ツモ列を待ちの順に、続けてロン列） */
  readonly cells: readonly MachiCellRef[];
  /** マスごとの判定。「わからない」での開示では undefined（印を出さない） */
  readonly cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  readonly focused: MachiCellRef;
  readonly onFocusCell: (cell: MachiCellRef) => void;
  /** マスの正解を行に分けたもの（「3翻 40符」「5200点」、役なしは 1 行） */
  readonly correctAnswerLinesOf: (cell: MachiCellRef) => readonly string[];
}) {
  const t = useTranslations("machiScore");
  const tCommon = useTranslations("common");
  const focusedKey = cellKeyOf(focused);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.tabs}
      accessibilityRole="tablist"
      accessibilityLabel={t("result.summaryTitle")}
    >
      {cells.map((cell) => {
        const key = cellKeyOf(cell);
        const isFocused = key === focusedKey;
        const result = cellResults?.[key];
        const verdict = result
          ? result.isCorrect
            ? "correct"
            : "incorrect"
          : undefined;
        const correctLines = correctAnswerLinesOf(cell);
        const winLabel = t(cell.isTsumo ? "cells.tsumo" : "cells.ron");
        return (
          <Pressable
            key={key}
            onPress={() => onFocusCell(cell)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={[
              winLabel,
              haiIdToMpsz(cell.agariHai),
              ...correctLines,
              verdict && tCommon(verdict),
            ]
              .filter(Boolean)
              .join(" ")}
            style={[
              styles.tab,
              { backgroundColor: tabBackground(verdict, isFocused) },
              isFocused ? styles.tabFocused : styles.tabIdle,
            ]}
          >
            <View style={styles.tabHead}>
              <Text style={styles.tabText}>{winLabel}</Text>
              <Hai hai={cell.agariHai} size="xs" />
              {verdict !== undefined && (
                <JudgementMark verdict={verdict} size={14} />
              )}
            </View>
            {/* 正解の点数。行ごとに 1 行に固定し、タブの高さを揃える */}
            {correctLines.map((line) => (
              <Text key={line} style={styles.tabText} numberOfLines={1}>
                {line}
              </Text>
            ))}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    // 選択中のタブがパネルの上枠を覆うよう、パネルに重ねて手前に描く
    marginBottom: -PANEL_BORDER,
    zIndex: 1,
    elevation: 1,
    flexGrow: 0,
  },
  tabs: {
    alignItems: "stretch",
    gap: 2,
  },
  tab: {
    alignItems: "center",
    gap: 2,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: colors.ink,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  tabIdle: {
    marginBottom: PANEL_BORDER,
    paddingBottom: 6,
  },
  tabFocused: {
    paddingBottom: 6 + PANEL_BORDER,
  },
  tabHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface800,
  },
});

import { Fragment, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslations } from "use-intl";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { haiIdToMspz } from "@mahjong-scoring/core";
import {
  cellKeyOf,
  type MachiCellRef,
} from "@mahjong-scoring/features/practice/machi-score/cell-ref";
import {
  buildWaitCellRuns,
  type WaitCellRun,
} from "@mahjong-scoring/features/practice/machi-score/wait-cell-runs";

import { PressableSurface } from "../../../components/pressable-surface";
import { Tile } from "../../../components/tile";
import { colors, radius, shadowOffset } from "../../../lib/theme";

/** マス 1 つの高さ（px）。回答の文字が 3 行まで収まる高さ */
const ROW_HEIGHT = 64;
/** 行の間隔（px） */
const ROW_GAP = 8;
/** 待ち牌の列の幅（web の `w-14`） */
const WAIT_COLUMN_WIDTH = 56;

/** 琥珀の破線（web の `amber-400` / `amber-300`。テーマのトークンに無い段） */
const AMBER_400 = "#fbbf24";
const AMBER_300 = "#fcd34d";

/** マスの状態（描画の見た目と文言を決める。web の `CellState`） */
type CellState = "answered" | "answering" | "joinable" | "unanswered";

/**
 * マスの枠と背景（web の `CELL_CLASSES`）
 *
 * 回答済みが緑（決めた面）、回答中が琥珀（今触っている面）。同じ列の未回答は
 * 琥珀の破線で「回答中に加われる」ことを示し、他の列の未回答は灰の破線。
 */
const CELL_STYLES: Readonly<Record<CellState, ViewStyle>> = {
  answered: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  answering: {
    borderColor: colors.amber500,
    backgroundColor: colors.amber50,
  },
  joinable: {
    borderColor: AMBER_400,
    borderStyle: "dashed",
    backgroundColor: "rgba(255,251,235,0.4)",
  },
  unanswered: {
    borderColor: colors.surface300,
    borderStyle: "dashed",
    backgroundColor: colors.surface50,
  },
};

const CELL_TEXT_COLORS: Readonly<Record<CellState, string>> = {
  answered: colors.surface900,
  answering: colors.surface900,
  joinable: colors.surface700,
  unanswered: colors.surface400,
};

/** n 行ぶんの高さ（行の間隔を含む） */
function spanHeight(rows: number): number {
  return rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;
}

interface WaitCellGridProps {
  readonly question: MachiScoreQuestion;
  /** マスごとの回答（キーは `cellKeyOf`） */
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  readonly selectedCells: readonly MachiCellRef[];
  /** 回答を 1 行にする（親ツモの「オール」など表示の都合は呼び出し側が持つ） */
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  readonly onToggleCell: (cell: MachiCellRef) => void;
}

/**
 * 待ち × ツモ/ロン のマスの表（web の `WaitCellGrid`）
 * 待ちマス表
 *
 * 行が待ち牌、列が和了方法。マスを押すと選択に入り、回答欄で入れた点数が
 * 選択中のマスすべてに当てはまる。同じ列で縦に隣り合う選択中のマスは
 * 1 つのマスにつなげて「まとめて回答中」を 1 つだけ出し、当てはめた後も
 * 縦に隣り合って回答が同じマスは 1 つの塊にする（理由は web の TSDoc）。
 *
 * web は表の `rowSpan` で塊をつなぐ。React Native には表が無いので、列ごとに
 * 縦に積み、塊は行の高さの合計の面として描く（行の高さを固定して列を揃える）。
 */
export function WaitCellGrid({
  question,
  cellAnswers,
  selectedCells,
  formatAnswer,
  onToggleCell,
}: WaitCellGridProps) {
  const t = useTranslations("machiScore.cells");
  // 選択中のマスは同じ列に限られる（ストアが保証する）ので先頭で列が決まる
  const selectedIsTsumo = selectedCells[0]?.isTsumo;

  const {
    runAt: runs,
    absorbed,
    selectedKeys,
  } = buildWaitCellRuns(question, cellAnswers, selectedCells);

  /** 塊の文字。全マスの回答が同じならその回答、そうでなければ「まとめて回答中」 */
  const runLabel = (run: WaitCellRun) =>
    run.answer
      ? formatAnswer(run.answer, run.cells[0].isTsumo)
      : t("answeringTogether");

  const cellFace = (
    state: CellState,
    label: string,
    height: number,
    onPress: () => void,
    selected: boolean,
  ) => (
    <PressableSurface
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      containerStyle={{ height }}
      style={[styles.cell, CELL_STYLES[state]]}
    >
      <Text
        style={[styles.cellText, { color: CELL_TEXT_COLORS[state] }]}
        numberOfLines={3}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </PressableSurface>
  );

  const renderRun = (run: WaitCellRun): ReactNode => {
    const label = runLabel(run);
    const height = spanHeight(run.cells.length);
    if (run.group !== "answering") {
      return cellFace(
        "answered",
        label,
        height,
        () => {
          for (const member of run.cells) onToggleCell(member);
        },
        false,
      );
    }
    // 見た目は 1 枚のマス、押す単位は行。行ごとの押せる面は透明で積み、
    // 文字は面の上に重ねる（行の区切りの破線が文字を横切らないよう、文字の
    // 背後だけ塗る）
    const offset = shadowOffset.sm;
    return (
      <View
        style={{ height, paddingRight: offset, paddingBottom: offset }}
        accessibilityLabel={label}
      >
        <View
          pointerEvents="none"
          style={[styles.groupShadow, { top: offset, left: offset }]}
        />
        <View style={[styles.cell, styles.group, CELL_STYLES.answering]}>
          {run.cells.map((member, i) => (
            <Pressable
              key={cellKeyOf(member)}
              onPress={() => onToggleCell(member)}
              accessibilityRole="button"
              accessibilityState={{ selected: true }}
              accessibilityLabel={t("removeFromSelection", {
                hai: haiIdToMspz(member.agariHai),
              })}
              style={[styles.groupRow, i > 0 && styles.groupRowDivider]}
            />
          ))}
          <View pointerEvents="none" style={styles.groupLabelWrap}>
            <Text style={styles.groupLabel} numberOfLines={3}>
              {label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderColumn = (isTsumo: boolean) => (
    <View style={styles.column}>
      <Text style={styles.header}>{t(isTsumo ? "tsumo" : "ron")}</Text>
      <View style={styles.cells}>
        {question.waits.map((wait) => {
          const cell = { agariHai: wait.agariHai, isTsumo };
          const key = cellKeyOf(cell);
          if (absorbed.has(key)) return undefined;
          const run = runs.get(key);
          if (run) return <Fragment key={key}>{renderRun(run)}</Fragment>;

          const answer = cellAnswers[key];
          const isSelected = selectedKeys.has(key);
          const state: CellState = isSelected
            ? "answering"
            : answer
              ? "answered"
              : selectedIsTsumo === isTsumo
                ? "joinable"
                : "unanswered";
          return (
            <Fragment key={key}>
              {cellFace(
                state,
                answer ? formatAnswer(answer, isTsumo) : t(state),
                ROW_HEIGHT,
                () => onToggleCell(cell),
                isSelected,
              )}
            </Fragment>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.grid}>
      <View style={styles.waitColumn}>
        <Text style={styles.header}>{t("wait")}</Text>
        <View style={styles.cells}>
          {question.waits.map((wait) => (
            <View key={wait.agariHai} style={styles.waitCell}>
              <Tile hai={wait.agariHai} size="sm" />
            </View>
          ))}
        </View>
      </View>
      {renderColumn(true)}
      {renderColumn(false)}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 8,
  },
  waitColumn: {
    width: WAIT_COLUMN_WIDTH,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  cells: {
    gap: ROW_GAP,
  },
  waitCell: {
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderRadius: radius.lg,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cellText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  groupShadow: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
  },
  group: {
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "stretch",
  },
  groupRow: {
    flex: 1,
    alignSelf: "stretch",
  },
  groupRowDivider: {
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderTopColor: AMBER_300,
  },
  groupLabelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  groupLabel: {
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.amber50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.surface900,
  },
});

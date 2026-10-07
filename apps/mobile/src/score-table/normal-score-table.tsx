import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { HAN_COLS } from "@mahjong-scoring/features/score-table/han-cols";
import {
  FREQUENT_FU,
  FU_ROWS,
  normalCellId,
  scoreGridKey,
} from "@mahjong-scoring/features/score-table/score-grid";
import type { Role, RoleScore, WinType } from "@mahjong-scoring/core";
import type { NormalCellHighlight } from "@mahjong-scoring/features/score-table/focus";

import { DataTable, type DataTableColumn } from "../components/data-table";
import { tableHighlight } from "../lib/table-highlight";
import { colors } from "../lib/theme";
import type { FocusAnchor } from "./focus-anchor";
import { HideableScore } from "./hideable-score";
import { TsumoScore } from "./tsumo-score";

/** 符の列の幅。見出しの「符＼翻」が折り返さない最小限（web の `w-16`） */
const FU_COLUMN_WIDTH = 60;

interface NormalScoreTableProps {
  /** `${han}-${fu}` → 点数計算結果のグリッド */
  readonly scoreGrid: ReadonlyMap<string, RoleScore>;
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  /** セルタップでの隠す切り替え。省略時はセルがタップを受けない */
  readonly onToggleCell: ((id: string) => void) | undefined;
  /** 注目させるセル（翻の列 × 符の行）。無ければハイライトしない */
  readonly highlight: NormalCellHighlight | undefined;
  /** 注目セルの中身に付ける印（スクロールの的） */
  readonly focusAnchor: FocusAnchor;
}

/**
 * 満貫未満の符×翻 点数表（web の `NormalScoreTable`）
 * 通常点数表
 *
 * セルのタップで数字を隠す（暗記用）。翻の 4 列は等幅にし、親子・ロンツモを
 * 切り替えても数字の居場所が動かないようにする。頻出符（30・40符）の行見出しは
 * 太字で示す。`highlight` のセルは符の行見出し・翻の列見出しとあわせて琥珀で
 * 塗り、セル自体には枠線を足して交点を示す（web と同じ）。
 */
export function NormalScoreTable({
  scoreGrid,
  activeTab,
  winType,
  hiddenCells,
  onToggleCell,
  highlight,
  focusAnchor,
}: NormalScoreTableProps) {
  const t = useTranslations("scoreTable");

  const columns: readonly DataTableColumn[] = [
    {
      label: `${t("fuSuffix")}＼${t("hanSuffix")}`,
      align: "left",
      width: FU_COLUMN_WIDTH,
    },
    ...HAN_COLS.map((han): DataTableColumn => ({
      label: `${han}${t("hanSuffix")}`,
      align: "center",
    })),
  ];

  const rows = FU_ROWS.map((fu) => {
    const isFrequent = FREQUENT_FU.has(fu);
    const fuCell = (
      <Text
        style={[
          styles.fu,
          isFrequent && styles.fuFrequent,
          highlight?.fu === fu && tableHighlight.headerText,
        ]}
      >
        {fu}
      </Text>
    );
    const scoreCells = HAN_COLS.map((han) => {
      const score = scoreGrid.get(scoreGridKey(han, fu));
      if (score === undefined) {
        return (
          <Text key={han} style={styles.invalid}>
            -
          </Text>
        );
      }
      const cellId = normalCellId(activeTab, winType, han, fu);
      const isFocus = highlight?.han === han && highlight.fu === fu;
      const content = (
        <HideableScore
          key={han}
          hidden={hiddenCells[cellId] === true}
          onToggle={
            onToggleCell === undefined ? undefined : () => onToggleCell(cellId)
          }
        >
          {score.isMangan ? (
            <Text style={styles.score}>{t("mangan")}</Text>
          ) : winType === "ron" ? (
            <Text style={styles.score}>{score.ron}</Text>
          ) : (
            <TsumoScore payment={score.tsumo} textStyle={styles.score} />
          )}
        </HideableScore>
      );
      return isFocus ? (
        <View
          key={han}
          ref={focusAnchor.ref}
          onLayout={focusAnchor.onLayout}
          collapsable={false}
        >
          {content}
        </View>
      ) : (
        content
      );
    });
    return [fuCell, ...scoreCells];
  });

  // 列 0 は符の行見出し、列 1〜 は HAN_COLS の順
  const hanOfColumn = (column: number) => HAN_COLS[column - 1];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      density="dense"
      headerCellStyle={(column) =>
        highlight !== undefined && hanOfColumn(column) === highlight.han
          ? { cell: tableHighlight.header, text: tableHighlight.headerText }
          : undefined
      }
      cellStyle={(row, column) => {
        if (highlight === undefined || FU_ROWS[row] !== highlight.fu) {
          return undefined;
        }
        if (column === 0) return tableHighlight.header;
        return hanOfColumn(column) === highlight.han
          ? tableHighlight.focus
          : undefined;
      }}
    />
  );
}

const styles = StyleSheet.create({
  fu: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface600,
  },
  fuFrequent: {
    fontWeight: "700",
    color: colors.surface900,
  },
  invalid: {
    fontSize: 14,
    color: colors.surface400,
    textAlign: "center",
  },
  score: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary600,
    textAlign: "center",
  },
});

import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { Role, RoleScore, WinType } from "@mahjong-scoring/core";

import { DataTable, type DataTableColumn } from "../components/data-table";
import { colors } from "../lib/theme";
import { HideableScore } from "./hideable-score";
import { TsumoScore } from "./tsumo-score";

/** 符×翻表の翻数列（1〜4翻）。5翻以上は満貫以上の表が受け持つ */
export const HAN_COLS = [1, 2, 3, 4] as const;

/** 符×翻表の符行（20〜110符） */
const FU_ROWS = FU_VALUES;

/** 頻出符（30・40符）。行見出しを太字で示す */
const FREQUENT_FU: ReadonlySet<number> = new Set([30, 40]);

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
}

/**
 * 満貫未満の符×翻 点数表（web の `NormalScoreTable`）
 * 通常点数表
 *
 * セルのタップで数字を隠す（暗記用）。翻の 4 列は等幅にし、親子・ロンツモを
 * 切り替えても数字の居場所が動かないようにする。頻出符（30・40符）の行見出しは
 * 太字で示す。
 */
export function NormalScoreTable({
  scoreGrid,
  activeTab,
  winType,
  hiddenCells,
  onToggleCell,
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
      <Text style={[styles.fu, isFrequent && styles.fuFrequent]}>{fu}</Text>
    );
    const scoreCells = HAN_COLS.map((han) => {
      const score = scoreGrid.get(`${han}-${fu}`);
      if (score === undefined) {
        return (
          <Text key={han} style={styles.invalid}>
            -
          </Text>
        );
      }
      const cellId = `${activeTab}-${winType}-${han}han-${fu}fu`;
      return (
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
    });
    return [fuCell, ...scoreCells];
  });

  return <DataTable columns={columns} rows={rows} density="dense" />;
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

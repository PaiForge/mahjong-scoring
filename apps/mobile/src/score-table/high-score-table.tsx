import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { HIGH_SCORES } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";

import { DataTable, type DataTableColumn } from "../components/data-table";
import { colors } from "../lib/theme";
import { HideableScore } from "./hideable-score";
import { TsumoScore } from "./tsumo-score";

interface HighScoreTableProps {
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  /** セルタップでの隠す切り替え。省略時はセルがタップを受けない */
  readonly onToggleCell: ((id: string) => void) | undefined;
}

/**
 * 満貫以上の点数表（種類×翻数×点数。web の `HighScoreTable`）
 * 高打点点数表
 *
 * 点数のセルのタップで数字を隠す（暗記用）。
 */
export function HighScoreTable({
  activeTab,
  winType,
  hiddenCells,
  onToggleCell,
}: HighScoreTableProps) {
  const t = useTranslations("scoreTable");
  const isKo = activeTab === "ko";

  const columns: readonly DataTableColumn[] = [
    { label: t("name"), align: "left", flex: 1.2 },
    { label: t("hanSuffix"), align: "right" },
    { label: t("score"), align: "right", flex: 1.2 },
  ];

  const rows = HIGH_SCORES.map((item) => {
    const cellId = `${activeTab}-${winType}-${item.nameKey}`;
    return [
      <Text key="name" style={styles.name}>
        {t(item.nameKey)}
      </Text>,
      <Text key="han" style={styles.han}>
        {item.han}
        {t("hanSuffix")}
      </Text>,
      <HideableScore
        key="score"
        hidden={hiddenCells[cellId] === true}
        onToggle={
          onToggleCell === undefined ? undefined : () => onToggleCell(cellId)
        }
      >
        {winType === "ron" ? (
          <Text style={styles.score}>{isKo ? item.ronKo : item.ronOya}</Text>
        ) : (
          <TsumoScore
            payment={isKo ? item.tsumoKo : item.tsumoOya}
            textStyle={styles.score}
          />
        )}
      </HideableScore>,
    ];
  });

  return <DataTable columns={columns} rows={rows} />;
}

const styles = StyleSheet.create({
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface900,
  },
  han: {
    fontSize: 14,
    color: colors.surface600,
    textAlign: "right",
  },
  score: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary600,
    textAlign: "right",
  },
});

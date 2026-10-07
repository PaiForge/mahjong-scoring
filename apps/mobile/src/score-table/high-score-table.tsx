import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { HIGH_SCORES } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import { highScoreCellId } from "@mahjong-scoring/features/score-table/score-grid";

import { DataTable, type DataTableColumn } from "../components/data-table";
import { tableHighlight } from "../lib/table-highlight";
import { colors } from "../lib/theme";
import type { FocusAnchor } from "./focus-anchor";
import { HideableScore } from "./hideable-score";
import { TsumoScore } from "./tsumo-score";

interface HighScoreTableProps {
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  /** セルタップでの隠す切り替え。省略時はセルがタップを受けない */
  readonly onToggleCell: ((id: string) => void) | undefined;
  /** 注目させる区分（`HIGH_SCORES` の nameKey）。無ければハイライトしない */
  readonly highlightKey: string | undefined;
  /** 注目する行の中身に付ける印（スクロールの的） */
  readonly focusAnchor: FocusAnchor;
}

/**
 * 満貫以上の点数表（種類×翻数×点数。web の `HighScoreTable`）
 * 高打点点数表
 *
 * 点数のセルのタップで数字を隠す（暗記用）。`highlightKey` の区分の行は
 * 琥珀で塗る（web と同じ）。
 */
export function HighScoreTable({
  activeTab,
  winType,
  hiddenCells,
  onToggleCell,
  highlightKey,
  focusAnchor,
}: HighScoreTableProps) {
  const t = useTranslations("scoreTable");
  const isKo = activeTab === "ko";

  const columns: readonly DataTableColumn[] = [
    { label: t("name"), align: "left", flex: 1.2 },
    { label: t("hanSuffix"), align: "right" },
    { label: t("score"), align: "right", flex: 1.2 },
  ];

  const rows = HIGH_SCORES.map((item) => {
    const cellId = highScoreCellId(activeTab, winType, item.nameKey);
    const name = (
      <Text key="name" style={styles.name}>
        {t(item.nameKey)}
      </Text>
    );
    return [
      item.nameKey === highlightKey ? (
        <View
          key="name"
          ref={focusAnchor.ref}
          onLayout={focusAnchor.onLayout}
          collapsable={false}
        >
          {name}
        </View>
      ) : (
        name
      ),
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

  return (
    <DataTable
      columns={columns}
      rows={rows}
      cellStyle={(row) =>
        HIGH_SCORES[row]?.nameKey === highlightKey
          ? tableHighlight.cell
          : undefined
      }
    />
  );
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

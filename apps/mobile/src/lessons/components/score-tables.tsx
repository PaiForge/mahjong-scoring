import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  YAKU_HAN_ENTRIES,
  groupYakuHanEntriesByMenzenHan,
  type Role,
} from "@mahjong-scoring/core";
import { buildExtraFuRows } from "@mahjong-scoring/features/curriculum/extra-fu-rows";
import {
  buildFixedFuRows,
  type FixedFuTableShape,
} from "@mahjong-scoring/features/curriculum/fixed-fu-rows";
import type { FixedHandShape } from "@mahjong-scoring/features/practice/score/hand-shape-param";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";

import { DataTable } from "../../components/data-table";
import { colors } from "../../lib/theme";
import { TableCaption } from "./guide-text";
import { MutedCell, RowHeaderCell, StrongCell } from "./table-cells";
import { TsumoScore } from "./tsumo-score";
import { FU_CHECKLIST_ROWS } from "@mahjong-scoring/features/curriculum/fu-checklist-rows";

/**
 * 符が固定される役の点数表（ツモ／ロン × 翻数）（web の `FixedFuScoreTable`）
 * 固定符点数表
 *
 * 平和・七対子の章で使う。値は features の `buildFixedFuRows`（core の計算）が
 * 組み立て、存在しない組み合わせは "-" を出す。
 *
 * @param role 子・親のどちらの点数を表示するか
 * @param shape 対象の役の符と翻数の並び
 */
export function FixedFuScoreTable({
  role,
  shape,
}: {
  readonly role: Role;
  readonly shape: FixedFuTableShape;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  const rows = buildFixedFuRows(role, shape);
  const dash = <MutedCell>-</MutedCell>;

  return (
    <View style={styles.block}>
      <TableCaption>
        {role === "ko" ? t("tableKo") : t("tableOya")}
      </TableCaption>
      <DataTable
        columns={[
          { label: t("colWin"), flex: 1.1 },
          ...shape.hanCols.map((han) => ({
            label: t("hanUnit", { value: han }),
            align: "center" as const,
          })),
        ]}
        rows={[
          [
            <RowHeaderCell key="win">{t("tsumo")}</RowHeaderCell>,
            ...rows.tsumo.map((cell) =>
              cell.score ? (
                <TsumoScore
                  key={cell.han}
                  payment={cell.score}
                  color={colors.primary600}
                />
              ) : (
                <View key={cell.han}>{dash}</View>
              ),
            ),
          ],
          [
            <RowHeaderCell key="win">{t("ron")}</RowHeaderCell>,
            ...rows.ron.map((cell) =>
              cell.score === undefined ? (
                <View key={cell.han}>{dash}</View>
              ) : (
                <StrongCell key={cell.han}>{cell.score}</StrongCell>
              ),
            ),
          ],
        ]}
      />
    </View>
  );
}

/**
 * 積み上げた符から符を引く対応表（web の `ExtraFuTable`）
 * 積み上げ符対応表
 *
 * 行は features の `buildExtraFuRows`（core の `mentsuTehaiFu` 由来）が組み立てる。
 *
 * @param handShape 門前手 / 副露した手のどちらの表か
 */
export function ExtraFuTable({
  handShape,
}: {
  readonly handShape: FixedHandShape;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  const rows = buildExtraFuRows(handShape);
  return (
    <DataTable
      columns={[
        { label: t("colExtraFu"), flex: 1.4 },
        { label: t("tsumo"), align: "center" },
        { label: t("ron"), align: "center" },
      ]}
      rows={rows.map((row) => [
        <RowHeaderCell key="from">
          {row.from === row.to
            ? t("fuUnit", { value: row.from })
            : t("fuRange", { from: row.from, to: row.to })}
        </RowHeaderCell>,
        <StrongCell key="tsumo">
          {t("fuUnit", { value: row.tsumoFu })}
        </StrongCell>,
        <StrongCell key="ron">{t("fuUnit", { value: row.ronFu })}</StrongCell>,
      ])}
    />
  );
}

/**
 * 翻数別の役まとめ表（web の `YakuHanTable`）
 * 翻数別役一覧表
 *
 * 役と翻数は core の `YAKU_HAN_ENTRIES` を単一ソースとする。web は役名を
 * 役一覧（`/reference/yaku`）の該当カードへのリンクにするが、モバイルには
 * 役一覧がまだ無いので素のテキストで並べる。
 */
export function YakuHanTable() {
  const t = useTranslations("yaku.learn");
  const groups = groupYakuHanEntriesByMenzenHan(YAKU_HAN_ENTRIES);
  return (
    <DataTable
      columns={[
        { label: t("colHan"), flex: 1 },
        { label: t("colYakuList"), flex: 3 },
      ]}
      rows={groups.map((group) => [
        <StrongCell key="han">{yakuHanLabel(group.han, t)}</StrongCell>,
        <View key="list" style={styles.yakuList}>
          {group.entries.map((entry) => (
            <Text key={entry.name} style={styles.yaku}>
              {entry.name}
            </Text>
          ))}
        </View>,
      ])}
    />
  );
}

/**
 * 符を数える場所のチェックリスト（web の `FuChecklistTable`）
 * 符チェックリスト
 *
 * 条件は列を足さず場所の下に小さく添える。
 */
export function FuChecklistTable() {
  const t = useTranslations("tehaiFu.learn");
  return (
    <DataTable
      columns={[
        { label: t("checklistColPlace"), flex: 3 },
        { label: t("checklistColFu"), align: "right", flex: 1.2 },
      ]}
      rows={FU_CHECKLIST_ROWS.map((key) => [
        <View key="place" style={styles.place}>
          <Text style={styles.placeLabel}>
            {t(`checklistRows.${key}.label`)}
          </Text>
          <Text style={styles.placeCondition}>
            {t(`checklistRows.${key}.condition`)}
          </Text>
        </View>,
        <StrongCell key="fu">{t(`checklistRows.${key}.fu`)}</StrongCell>,
      ])}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  yakuList: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 4,
  },
  yaku: {
    paddingVertical: 2,
    fontSize: 14,
    color: colors.surface700,
  },
  place: {
    gap: 2,
  },
  placeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface900,
  },
  placeCondition: {
    fontSize: 12,
    color: colors.surface500,
  },
});

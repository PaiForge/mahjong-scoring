import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { Role, WinType, YakuHanEntry } from "@mahjong-scoring/core";
import {
  buildFixedFuRows,
  type FixedFuTableShape,
} from "@mahjong-scoring/features/curriculum/fixed-fu-rows";
import type { FixedHandShape } from "@mahjong-scoring/features/practice/score/hand-shape-param";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";
import { buildNakiComparisonGroups } from "@mahjong-scoring/features/yaku/naki-comparison";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";
import { buildTenpaneRows } from "@mahjong-scoring/features/curriculum/tenpane-rows";

import { DataTable } from "../../components/data-table";
import { linkStyles } from "../../lib/link-styles";
import { colors } from "../../lib/theme";
import { referenceYakuHref } from "../../reference/routes";
import { TableCaption } from "./guide-text";
import { MutedCell, PlainCell, RowHeaderCell, StrongCell } from "./table-cells";
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
                  color={colors.foreground}
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
 * 符がテンパネする典型例の表（web の `TenpaneTable`）
 * テンパネ典型例表
 *
 * 行は features の `buildTenpaneRows`（core の `mentsuTehaiFu` 由来）が組み立てる。
 *
 * @param handShape 門前手 / 副露した手のどちらの表か
 * @param winType ツモ / ロンのどちらの表か
 */
export function TenpaneTable({
  handShape,
  winType,
}: {
  readonly handShape: FixedHandShape;
  readonly winType: WinType;
}) {
  const t = useTranslations("learnCurriculum");
  const rows = buildTenpaneRows(handShape, winType);
  return (
    <DataTable
      columns={[
        { label: t("tenpaneTable.colExample"), flex: 2 },
        { label: t("tenpaneTable.colSum"), flex: 1.2, align: "center" },
        { label: t("tenpaneTable.colFu"), flex: 1.2, align: "center" },
      ]}
      rows={rows.map((row) => [
        <PlainCell key="example">{t(`tenpaneExamples.${row.key}`)}</PlainCell>,
        <MutedCell key="sum" tone={500}>
          {t("tenpaneTable.sum", {
            start: row.startFu,
            extra: row.extraFu,
            total: row.totalFu,
          })}
        </MutedCell>,
        <StrongCell key="fu">
          {row.totalFu === row.fu
            ? t("tenpaneTable.fuExact", { value: row.fu })
            : t("tenpaneTable.fu", { value: row.fu })}
        </StrongCell>,
      ])}
    />
  );
}

/**
 * 門前と鳴きの翻数の比較表（web の `YakuNakiComparisonTable`）
 * 門前鳴き比較表
 *
 * 役ごとに門前と鳴いたときの翻数を並べ、3 区分を区切りの行で分ける。載せる
 * 役と区分は `buildNakiComparisonGroups` が決める（web と同じ）。各役名は
 * 役一覧のその役へのリンクで、早見表に載らない状況役（立直）だけは素のテキスト。
 */
export function YakuNakiComparisonTable() {
  const t = useTranslations("yaku.learn");
  const router = useRouter();
  const groups = buildNakiComparisonGroups();
  const nakiCell = (entry: YakuHanEntry) =>
    entry.nakiHan === undefined ? (
      <Text
        key="naki"
        accessibilityLabel={t("notEstablishedLabel")}
        style={styles.notEstablished}
      >
        {t("notEstablished")}
      </Text>
    ) : (
      <PlainCell key="naki">{yakuHanLabel(entry.nakiHan, t)}</PlainCell>
    );
  return (
    <DataTable
      columns={[
        { label: t("colYaku"), flex: 2 },
        { label: t("colMenzen"), align: "center", flex: 1 },
        { label: t("colNaki"), align: "center", flex: 1 },
      ]}
      rows={groups.flatMap((group) => [
        { section: t(`nakiKinds.${group.kind}`) },
        ...group.entries.map((entry) => [
          hasYakuCheatsheetEntry(entry.name) ? (
            <Text
              key="yaku"
              onPress={() => router.push(referenceYakuHref(entry.name))}
              accessibilityRole="link"
              style={[styles.yaku, linkStyles.inline]}
            >
              {entry.name}
            </Text>
          ) : (
            <Text key="yaku" style={styles.yaku}>
              {entry.name}
            </Text>
          ),
          <PlainCell key="menzen">
            {yakuHanLabel(entry.menzenHan, t)}
          </PlainCell>,
          nakiCell(entry),
        ]),
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
  yaku: {
    fontSize: 14,
    color: colors.surface700,
  },
  notEstablished: {
    fontSize: 14,
    color: colors.surface400,
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

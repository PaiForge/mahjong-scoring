import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  calculateKoScore,
  calculateOyaScore,
  type Fu,
  type Role,
  type WinType,
} from "@mahjong-scoring/core";
import {
  buildFuPairRows,
  buildHanDoublingRows,
  type FuPair,
  type FuPairCell,
} from "@mahjong-scoring/features/curriculum/fu-doubling-rows";
import { buildRonHalvingRows } from "@mahjong-scoring/features/curriculum/ron-halving-rows";
import { buildTsumoSplitRows } from "@mahjong-scoring/features/curriculum/tsumo-payment-rows";
import { HAN_COLS } from "@mahjong-scoring/features/score-table/han-cols";

import { DataTable } from "../../components/data-table";
import { colors, radius } from "../../lib/theme";
import { lessonColors } from "../lesson-colors";
import {
  DerivationArrow,
  DerivationFigure,
  DerivationStep,
  HalvingDiagram,
} from "./derivation-figure";
import { GuideParagraph, TableCaption } from "./guide-text";
import { MutedCell, PlainCell, RowHeaderCell, StrongCell } from "./table-cells";
import { TsumoScore } from "./tsumo-score";

/** 翻を行に取る表の 1 列ぶんの定義 */
interface HanRowsTableColumn<TRow> {
  readonly header: string;
  readonly render: (row: TRow) => ReactNode;
}

/**
 * 翻を行に取る教本の早見表（web の `HanRowsTable`）
 * 翻の早見表
 *
 * 「1翻・2翻・3翻…」を行見出しに、比べたい数字を列に並べる。左端の翻の
 * 列は表が自前で描き、各章は右側の列の定義だけを渡す。
 */
function HanRowsTable<TRow extends { readonly han: number }>({
  rows,
  columns,
}: {
  readonly rows: readonly TRow[];
  readonly columns: readonly HanRowsTableColumn<TRow>[];
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  return (
    <DataTable
      columns={[
        { label: t("colHan"), flex: 0.8 },
        ...columns.map((column) => ({
          label: column.header,
          align: "center" as const,
        })),
      ]}
      rows={rows.map((row) => [
        <RowHeaderCell key="han">
          {t("hanUnit", { value: row.han })}
        </RowHeaderCell>,
        ...columns.map((column, index) => (
          <View key={index}>{column.render(row)}</View>
        )),
      ])}
    />
  );
}

/**
 * 翻を1つずつ上げたときの点数を、切り上げ前の値と並べた表（web の `HanDoublingTable`）
 * 倍々の表
 *
 * @param fu 対象の符（4翻でも満貫に届かない符）
 * @param role 子・親のどちらの点数を出すか
 * @param caption 表の上に出す見出し
 */
export function HanDoublingTable({
  fu,
  role,
  caption,
}: {
  readonly fu: number;
  readonly role: Role;
  readonly caption: string;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  return (
    <View style={styles.block}>
      <TableCaption>{caption}</TableCaption>
      <HanRowsTable
        rows={buildHanDoublingRows(fu, role)}
        columns={[
          {
            header: t("colBeforeCeil"),
            render: (row) => <MutedCell tone={500}>{row.beforeCeil}</MutedCell>,
          },
          {
            header: t("colScore"),
            render: (row) => <StrongCell>{row.ron}</StrongCell>,
          },
        ]}
      />
    </View>
  );
}

/**
 * 符の組を2行だけ抜き出した点数表（web の `FuPairScoreTable`）
 * 符の組の点数表
 *
 * 相方の符の行に同じ点数がある（`linked`）セルに琥珀の地を敷く。色の付いた
 * 帯が上下の行で1列ぶんずれる形が、この章の主張（符が倍になることは1翻ぶんに
 * 等しい）を目に見せる。web はセル全体を塗るが、モバイルの表はセルの地を
 * 変えられないので、値の周りに地を敷く。
 */
export function FuPairScoreTable({
  pair,
  role,
  winType,
  caption,
}: {
  readonly pair: FuPair;
  readonly role: Role;
  readonly winType: WinType;
  readonly caption: string;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  const rows = buildFuPairRows(pair, role, winType);

  const renderValue = (cell: FuPairCell): ReactNode => {
    if (cell.score === undefined) return <MutedCell>-</MutedCell>;
    if (cell.score.isMangan) return <StrongCell>{t("mangan")}</StrongCell>;
    return winType === "ron" ? (
      <StrongCell>{cell.score.ron}</StrongCell>
    ) : (
      <TsumoScore payment={cell.score.tsumo} color={colors.primary600} />
    );
  };

  const renderRow = (fu: number, cells: readonly FuPairCell[]) => [
    <RowHeaderCell key="fu">{t("fuUnit", { value: fu })}</RowHeaderCell>,
    ...cells.map((cell) => (
      <View
        key={cell.han}
        style={[styles.pairCell, cell.linked && styles.linked]}
      >
        {renderValue(cell)}
      </View>
    )),
  ];

  return (
    <View style={styles.block}>
      <TableCaption>{caption}</TableCaption>
      <DataTable
        columns={[
          { label: t("colFuHan"), flex: 1.1 },
          ...HAN_COLS.map((han) => ({
            label: t("hanUnit", { value: han }),
            align: "center" as const,
          })),
        ]}
        rows={[renderRow(pair.low, rows.low), renderRow(pair.high, rows.high)]}
      />
    </View>
  );
}

/**
 * 符・翻の1枠について、子のロンから子ツモを導く図（web の `RonHalvingDiagram`）
 * 半分ずつの図（満貫未満）
 *
 * 絵は満貫以上の章と共有する。出発点のロンと答え合わせの子ツモは点数表と
 * 同じ `calculateKoScore` から取る。
 */
export function RonHalvingDiagram({
  fu,
  han,
}: {
  readonly fu: Fu;
  readonly han: number;
}) {
  const t = useTranslations("ronToTsumo.learn");
  const { ron, tsumo } = calculateKoScore(han, fu);
  return (
    <HalvingDiagram
      caption={t("diagramCaption", { fu, han })}
      ron={ron}
      payment={tsumo}
    />
  );
}

/**
 * 子のロンから導いた子ツモと、点数表の子ツモを並べた表（web の `RonHalvingTable`）
 * 半分ずつの内訳表
 *
 * @param fu 対象の符（ロンとツモが両方ある符）
 * @param caption 表の上に出す見出し
 */
export function RonHalvingTable({
  fu,
  caption,
}: {
  readonly fu: Fu;
  readonly caption: string;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  return (
    <View style={styles.block}>
      <PlainCaption>{caption}</PlainCaption>
      <HanRowsTable
        rows={buildRonHalvingRows(fu)}
        columns={[
          {
            header: t("colKoRon"),
            render: (row) => <MutedCell tone={500}>{row.ron}</MutedCell>,
          },
          {
            header: t("colDerived"),
            render: (row) => (
              <TsumoScore payment={row.derived} color={colors.primary600} />
            ),
          },
          {
            header: t("colActualPay"),
            render: (row) => (
              <TsumoScore payment={row.actual} color={colors.surface700} />
            ),
          },
        ]}
      />
    </View>
  );
}

/** 表の上の見出し（web の `text-sm font-semibold text-surface-700` の段落） */
function PlainCaption({ children }: { readonly children: string }) {
  return <PlainCell medium>{children}</PlainCell>;
}

/**
 * 子ツモの2つの数字を切り上げ前後で並べた表（web の `TsumoSplitTable`）
 * 子ツモの内訳表
 *
 * @param fu 対象の符（4翻でも満貫に届かない符）
 * @param caption 表の上に出す見出し
 */
export function TsumoSplitTable({
  fu,
  caption,
}: {
  readonly fu: Fu;
  readonly caption: string;
}) {
  const t = useTranslations("learnCurriculum.scoreTable");
  return (
    <View style={styles.block}>
      <TableCaption>{caption}</TableCaption>
      <HanRowsTable
        rows={buildTsumoSplitRows(fu)}
        columns={[
          {
            header: t("colBeforeCeil"),
            render: (row) => (
              <TsumoScore payment={row.beforeCeil} color={colors.surface500} />
            ),
          },
          {
            header: t("colActualPay"),
            render: (row) => (
              <TsumoScore payment={row.actual} color={colors.primary600} />
            ),
          },
        ]}
      />
    </View>
  );
}

/**
 * 子ツモの下段がそのまま親ツモになることを示す図（web の `TsumoCarryoverDiagram`）
 * ツモの持ち越し図
 *
 * 子ツモは上段を落として下段を前に出し、矢印の起点がどこなのかを示す。
 */
export function TsumoCarryoverDiagram({
  fu,
  han,
}: {
  readonly fu: Fu;
  readonly han: number;
}) {
  const t = useTranslations("tsumoPayments.learn");
  const ko = calculateKoScore(han, fu).tsumo;
  const oya = calculateOyaScore(han, fu).tsumo;
  return (
    <DerivationFigure
      caption={t("diagramCaption", { fu, han })}
      footer={
        <View style={styles.note}>
          <GuideParagraph>{t("diagramNote")}</GuideParagraph>
        </View>
      }
    >
      <DerivationStep label={t("diagramKoLabel")}>
        <TsumoScore payment={ko} color={colors.surface900} dimFromKo />
      </DerivationStep>
      <DerivationArrow label={t("diagramArrowLabel")} />
      <DerivationStep label={t("diagramOyaLabel")} highlighted>
        <TsumoScore payment={oya} color={colors.primary700} />
      </DerivationStep>
    </DerivationFigure>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  pairCell: {
    alignSelf: "stretch",
    alignItems: "center",
    borderRadius: radius.sm,
    paddingVertical: 2,
  },
  linked: {
    backgroundColor: lessonColors.amber50Solid,
    borderWidth: 1,
    borderColor: lessonColors.amber200Solid,
  },
  note: {
    alignItems: "center",
  },
});

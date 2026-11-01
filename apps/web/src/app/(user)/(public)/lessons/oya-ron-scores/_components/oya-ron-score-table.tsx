import { getTranslations } from "next-intl/server";

import {
  DATA_TABLE_CELL_PADDING,
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";
import { HAN_COLS } from "@mahjong-scoring/features/score-table/han-cols";
import { ScoreTableReferenceLink } from "../../_components/score-table-reference-link";

import type {
  OyaRonCell,
  OyaRonRow,
} from "@mahjong-scoring/features/curriculum/oya-ron-rows";

interface OyaRonScoreTableProps {
  /** 表の上に出す見出し（どちらのルールの表かを含む） */
  readonly caption: string;
  /** 表の行（`buildOyaRonRows` の結果） */
  readonly rows: readonly OyaRonRow[];
}

/**
 * 満貫未満の親ロンの表で、子のロンの1.5倍にならないセルに色を付けたもの
 * 親ロンのずれ表
 *
 * 早見表（`/reference/score-table`）の親ロンの満貫未満をそのまま写し、読む向きも
 * 早見表と揃えて翻を横に伸ばす。色の付いたセルが「覚えておくマス」そのもので、
 * 章の結論を目に見せる唯一の手段なので、色は装飾ではなく本文の一部として扱う。
 * 色だけに頼らないよう、ずれるセルには子のロンを1.5倍した値を括弧で添え、
 * 凡例の文言は章側が持つ。
 *
 * 点数とずれの判定は features の `curriculum/oya-ron-rows` 経由で core の計算を
 * 通す。章側にもこのファイルにも点数を書き起こさない。行は切り上げ満貫の
 * 設定ごとに章が組み立てて渡す。
 */
export async function OyaRonScoreTable({
  caption,
  rows,
}: OyaRonScoreTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");

  const renderCell = (cell: OyaRonCell) => {
    switch (cell.kind) {
      case "invalid":
        return <span className="text-surface-400">-</span>;
      case "mangan":
        return (
          <span className="font-semibold text-foreground">{t("mangan")}</span>
        );
      case "score":
        return (
          <>
            <span className="font-semibold text-foreground">{cell.oyaRon}</span>
            {cell.deviates && (
              <span className="block text-xs text-surface-500">
                ({cell.koRonTimesOneAndHalf})
              </span>
            )}
          </>
        );
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </h3>
      {/* 翻が複数列並ぶため、セルの余白は狭い画面でだけ詰める（dense）。
          それでも収まらない幅では DataTable の枠の中で横スクロールする */}
      <DataTable
        tableClassName="text-center"
        header={
          <>
            <DataTableHeaderCell align="left" density="dense">
              {t("colFuHan")}
            </DataTableHeaderCell>
            {HAN_COLS.map((han) => (
              <DataTableHeaderCell key={han} density="dense">
                {t("hanUnit", { value: han })}
              </DataTableHeaderCell>
            ))}
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.fu} className="bg-white">
            <DataTableRowHeaderCell density="dense">
              {t("fuUnit", { value: row.fu })}
            </DataTableRowHeaderCell>
            {row.cells.map((cell) => (
              <td
                key={cell.han}
                className={`${DATA_TABLE_CELL_PADDING.dense}${
                  cell.kind === "score" && cell.deviates
                    ? ` ${TABLE_HIGHLIGHT_CELL_CLASS}`
                    : ""
                }`}
              >
                {renderCell(cell)}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
      <ScoreTableReferenceLink role="oya" winType="ron" />
    </div>
  );
}

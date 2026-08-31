import { getTranslations } from "next-intl/server";
import { type Role, type WinType } from "@mahjong-scoring/core";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";
import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import {
  buildFuPairRows,
  type FuPair,
  type FuPairCell,
} from "../_lib/fu-doubling-rows";

interface FuPairScoreTableProps {
  /** 対象の符の組（`low` の2倍が `high`） */
  readonly pair: FuPair;
  readonly role: Role;
  readonly winType: WinType;
  /** 表の上に出す見出し（「子のロン」等） */
  readonly caption: string;
}

/**
 * 符の組を2行だけ抜き出した点数表
 * 符の組の点数表
 *
 * 早見表（`/reference/score-table`）から符2行ぶんを抜き出した形。読む向きも
 * 早見表と揃えて翻を横に伸ばす（向きが表ごとに変われば、同じ値を探すのに
 * 読み替えが要る）。
 *
 * 相方が存在するセルには背景色を敷く。色の付いた帯が上下の行で1列ぶん
 * ずれる形そのものが、この章の主張（符が倍になることは1翻ぶんに等しい）を
 * 目に見せる唯一の手段なので、色は装飾ではなく本文の一部として扱うこと。
 * 青は早見表で「参照している場所」を指す色で、頻出符の琥珀や正解の緑とは
 * 役割が違う。色だけに頼らないよう、表の下に凡例を添える文言を章側が持つ。
 *
 * 点数は `_lib/fu-doubling-rows` 経由で core の計算を通す。章側にも
 * このファイルにも点数を書き起こさない。
 */
export async function FuPairScoreTable({
  pair,
  role,
  winType,
  caption,
}: FuPairScoreTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildFuPairRows(pair, role, winType);

  const renderCell = (cell: FuPairCell) => {
    if (cell.score === undefined) {
      return <span className="text-surface-400">-</span>;
    }
    if (cell.score.isMangan) {
      return (
        <span className="font-semibold text-primary-600">{t("mangan")}</span>
      );
    }
    return (
      <span className="font-semibold text-primary-600">
        {winType === "ron" ? (
          cell.score.ron
        ) : (
          <TsumoScore payment={cell.score.tsumo} />
        )}
      </span>
    );
  };

  const renderRow = (fu: number, cells: readonly FuPairCell[]) => (
    <tr className="bg-white">
      <DataTableRowHeaderCell>
        {t("fuUnit", { value: fu })}
      </DataTableRowHeaderCell>
      {cells.map((cell) => (
        <td
          key={cell.han}
          className={`px-4 py-3${
            cell.linked ? ` ${TABLE_HIGHLIGHT_CELL_CLASS}` : ""
          }`}
        >
          {renderCell(cell)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </h3>
      {/* 翻が複数列並ぶため、狭い画面では表だけを横スクロールさせる */}
      <div className="w-full overflow-x-auto">
        <DataTable
          tableClassName="text-center"
          header={
            <>
              <DataTableHeaderCell align="left">
                {t("colFuHan")}
              </DataTableHeaderCell>
              {HAN_COLS.map((han) => (
                <DataTableHeaderCell key={han}>
                  {t("hanUnit", { value: han })}
                </DataTableHeaderCell>
              ))}
            </>
          }
        >
          {renderRow(pair.low, rows.low)}
          {renderRow(pair.high, rows.high)}
        </DataTable>
      </div>
    </div>
  );
}

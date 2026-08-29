import { getTranslations } from "next-intl/server";
import { type Role } from "@mahjong-scoring/core";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import {
  buildFixedFuRows,
  type FixedFuTableShape,
} from "../_lib/fixed-fu-rows";

interface FixedFuScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: Role;
  /** 対象の役の符と翻数の並び（`_lib/fixed-fu-rows` が持つ） */
  readonly shape: FixedFuTableShape;
}

/**
 * 符が固定される役の点数表（ツモ／ロン × 翻数）
 * 固定符点数表
 *
 * 平和（ツモ20符・ロン30符）や七対子（常に25符）のように、符が数通りに
 * 決まってしまう役の章で使う。符×翻の早見表（`/reference/score-table`）から
 * 該当する2行だけを抜き出した形にしている。翻数を横に伸ばす向きも早見表と
 * 揃えてあり（読む向きが表ごとに変わると、同じ値を探すのに読み替えが要る）、
 * 点数は早見表と同じ core の計算を通すので表記が二重管理になることもない。
 *
 * 行見出しは「ツモ」「ロン」だけにして符を書かない。どちらが何符かは表の
 * 直前の本文が言っており、行見出しに重ねると狭い画面で表が横に伸びるだけに
 * なる。符が1通りしかない役（七対子）でも同じ理由で行見出しは変えない。
 *
 * 表に出す値は `_lib/fixed-fu-rows` の {@link buildFixedFuRows} が組み立てる。
 * 存在しない組み合わせのセルは `undefined` で返るので "-" を出す。
 */
export async function FixedFuScoreTable({
  role,
  shape,
}: FixedFuScoreTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const isKo = role === "ko";
  const rows = buildFixedFuRows(role, shape);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {isKo ? t("tableKo") : t("tableOya")}
      </h3>
      {/* 翻が複数列並ぶため、狭い画面では表だけを横スクロールさせる */}
      <div className="w-full overflow-x-auto">
        <DataTable
          tableClassName="text-center"
          header={
            <>
              <DataTableHeaderCell align="left">
                {t("colWin")}
              </DataTableHeaderCell>
              {shape.hanCols.map((han) => (
                <DataTableHeaderCell key={han}>
                  {t("hanUnit", { value: han })}
                </DataTableHeaderCell>
              ))}
            </>
          }
        >
          <tr className="bg-white">
            <DataTableRowHeaderCell>{t("tsumo")}</DataTableRowHeaderCell>
            {rows.tsumo.map((cell) => (
              <td key={cell.han} className="px-4 py-3">
                {cell.score ? (
                  <span className="font-semibold text-primary-600">
                    <TsumoScore payment={cell.score} />
                  </span>
                ) : (
                  <span className="text-surface-400">-</span>
                )}
              </td>
            ))}
          </tr>
          <tr className="bg-white">
            <DataTableRowHeaderCell>{t("ron")}</DataTableRowHeaderCell>
            {rows.ron.map((cell) => (
              <td
                key={cell.han}
                className="px-4 py-3 font-semibold text-primary-600"
              >
                {cell.score ?? <span className="text-surface-400">-</span>}
              </td>
            ))}
          </tr>
        </DataTable>
      </div>
    </div>
  );
}

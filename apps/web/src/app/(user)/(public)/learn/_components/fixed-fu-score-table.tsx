import { getTranslations } from "next-intl/server";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type Role,
} from "@mahjong-scoring/core";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

interface FixedFuScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: Role;
  /** ツモ和了時の符 */
  readonly tsumoFu: number;
  /** ロン和了時の符 */
  readonly ronFu: number;
  /** 列に並べる翻数（昇順） */
  readonly hanCols: readonly number[];
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
 * 存在しない符×翻の組（1翻20符・2翻25符ツモ等）は core の
 * `isInvalidCell` が判定し、"-" を出す。章ごとに翻数の下限を書き分けない。
 *
 * 切り上げ満貫は適用しない。教本は標準ルールで書き、差分はコラムで説明する
 * （連風牌を扱う雀頭の符の章と同じ方針）。
 */
export async function FixedFuScoreTable({
  role,
  tsumoFu,
  ronFu,
  hanCols,
}: FixedFuScoreTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const isKo = role === "ko";
  const calculate = isKo ? calculateKoScore : calculateOyaScore;

  const tsumoPayments = hanCols.map((han) =>
    isInvalidCell(han, tsumoFu, "tsumo")
      ? undefined
      : calculate(han, tsumoFu).tsumo,
  );
  const ronScores = hanCols.map((han) =>
    isInvalidCell(han, ronFu, "ron") ? undefined : calculate(han, ronFu).ron,
  );

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
              {hanCols.map((han) => (
                <DataTableHeaderCell key={han}>
                  {t("hanUnit", { value: han })}
                </DataTableHeaderCell>
              ))}
            </>
          }
        >
          <tr className="bg-white">
            <DataTableRowHeaderCell>{t("tsumo")}</DataTableRowHeaderCell>
            {tsumoPayments.map((tsumo, index) => (
              <td key={hanCols[index]} className="px-4 py-3">
                {tsumo ? (
                  <span className="font-semibold text-primary-600">
                    <TsumoScore payment={tsumo} />
                  </span>
                ) : (
                  <span className="text-surface-400">-</span>
                )}
              </td>
            ))}
          </tr>
          <tr className="bg-white">
            <DataTableRowHeaderCell>{t("ron")}</DataTableRowHeaderCell>
            {ronScores.map((ron, index) => (
              <td
                key={hanCols[index]}
                className="px-4 py-3 font-semibold text-primary-600"
              >
                {ron ?? <span className="text-surface-400">-</span>}
              </td>
            ))}
          </tr>
        </DataTable>
      </div>
    </div>
  );
}

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
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

/** ピンフのロンの符。副底20符に門前ロンの加符が乗って30符になる */
const RON_FU = 30;

/** ピンフのツモの符。ツモ符が乗らず副底の20符のまま */
const TSUMO_FU = 20;

/**
 * 表に載せる翻数。
 * 5翻以上は符が点数に関与しなくなる（満貫以上の章が受け持つ）ため4翻まで。
 */
const HAN_ROWS = [1, 2, 3, 4] as const;

interface PinfuScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: Role;
}

/**
 * ピンフの点数表（翻数×ロン30符／ツモ20符）
 * ピンフ点数表
 *
 * ピンフの符は2通りしかないため、符×翻の早見表（`/reference/score-table`）から
 * 該当する2列だけを抜き出した形にしている。点数は早見表と同じ core の計算を
 * 通すので、表記が二重管理になることはない。
 *
 * 切り上げ満貫は適用しない。教本は標準ルールで書き、差分はコラムで説明する
 * （連風牌を扱う雀頭の符の章と同じ方針）。
 */
export async function PinfuScoreTable({ role }: PinfuScoreTableProps) {
  const t = await getTranslations("pinfuScore.learn");
  const isKo = role === "ko";

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
        {isKo ? t("tableKo") : t("tableOya")}
      </h3>
      {/* ツモ列の2段表示（子は上下、親は ALL）の読み方を表の直前で補う */}
      <p className="text-xs text-surface-500">
        {isKo ? t("tsumoNoteKo") : t("tsumoNoteOya")}
      </p>

      <DataTable
        tableClassName="text-center"
        header={
          <>
            <DataTableHeaderCell align="left">
              {t("colHan")}
            </DataTableHeaderCell>
            <DataTableHeaderCell>{t("colRon")}</DataTableHeaderCell>
            <DataTableHeaderCell>{t("colTsumo")}</DataTableHeaderCell>
          </>
        }
      >
        {HAN_ROWS.map((han) => {
          const calculate = isKo ? calculateKoScore : calculateOyaScore;
          const ron = calculate(han, RON_FU).ron;
          // 1翻のツモは存在しない（ツモると門前清自摸和が必ず付いて2翻以上になる）
          const tsumo = isInvalidCell(han, TSUMO_FU, "tsumo")
            ? undefined
            : calculate(han, TSUMO_FU).tsumo;

          return (
            <tr key={han} className="bg-white">
              <td className="px-4 py-3 text-left font-medium text-surface-600">
                {t("hanUnit", { value: han })}
              </td>
              <td className="px-4 py-3 font-semibold text-primary-600">
                {ron}
              </td>
              <td className="px-4 py-3">
                {tsumo ? (
                  <span className="font-semibold text-primary-600">
                    <TsumoScore payment={tsumo} />
                  </span>
                ) : (
                  <span className="text-surface-400">-</span>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}

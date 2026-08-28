import { getTranslations } from "next-intl/server";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type Role,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

/** ピンフのツモの符。ツモ符が乗らず副底の20符のまま */
const TSUMO_FU = 20;

/** ピンフのロンの符。副底20符に門前ロンの加符が乗って30符になる */
const RON_FU = 30;

/**
 * 列に並べる翻数。
 * 5翻以上は符が点数に関与しなくなる（満貫以上の章が受け持つ）ため4翻まで。
 */
const HAN_COLS = [1, 2, 3, 4] as const;

interface PinfuScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: Role;
}

/**
 * ピンフの点数表（ツモ20符／ロン30符 × 翻数）
 * ピンフ点数表
 *
 * ピンフの符は2通りしかないため、符×翻の早見表（`/reference/score-table`）から
 * 該当する2行だけを抜き出した形にしている。翻数を横に伸ばす向きも早見表と揃えて
 * あり（読む向きが表ごとに変わると、同じ値を探すのに読み替えが要る）、点数は
 * 早見表と同じ core の計算を通すので表記が二重管理になることもない。
 *
 * 行見出しは「ツモ」「ロン」だけにして符を書かない。どちらが何符かは表の直前の
 * 本文が言っており、行見出しに重ねると狭い画面で表が横に伸びるだけになる。
 *
 * 切り上げ満貫は適用しない。教本は標準ルールで書き、差分はコラムで説明する
 * （連風牌を扱う雀頭の符の章と同じ方針）。
 */
export async function PinfuScoreTable({ role }: PinfuScoreTableProps) {
  const t = await getTranslations("pinfuScore.learn");
  const isKo = role === "ko";
  const calculate = isKo ? calculateKoScore : calculateOyaScore;

  // 1翻のツモは存在しない（ツモると門前清自摸和が必ず付いて2翻以上になる）
  const tsumoPayments: readonly (TsumoPayment | undefined)[] = HAN_COLS.map(
    (han) =>
      isInvalidCell(han, TSUMO_FU, "tsumo")
        ? undefined
        : calculate(han, TSUMO_FU).tsumo,
  );
  const ronScores = HAN_COLS.map((han) => calculate(han, RON_FU).ron);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {isKo ? t("tableKo") : t("tableOya")}
      </h3>
      {/* ツモ行の2段表示（子は上下、親は ALL）の読み方を表の直前で補う */}
      <p className="text-xs text-surface-500">
        {isKo ? t("tsumoNoteKo") : t("tsumoNoteOya")}
      </p>

      {/* 翻が4列並ぶため、狭い画面では表だけを横スクロールさせる */}
      <div className="w-full overflow-x-auto">
        <DataTable
          tableClassName="text-center"
          header={
            <>
              <DataTableHeaderCell align="left">
                {t("colWin")}
              </DataTableHeaderCell>
              {HAN_COLS.map((han) => (
                <DataTableHeaderCell key={han}>
                  {t("hanUnit", { value: han })}
                </DataTableHeaderCell>
              ))}
            </>
          }
        >
          <tr className="bg-white">
            <td className="px-4 py-3 text-left font-medium whitespace-nowrap text-surface-600">
              {t("rowTsumo")}
            </td>
            {tsumoPayments.map((tsumo, index) => (
              <td key={HAN_COLS[index]} className="px-4 py-3">
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
            <td className="px-4 py-3 text-left font-medium whitespace-nowrap text-surface-600">
              {t("rowRon")}
            </td>
            {ronScores.map((ron, index) => (
              <td
                key={HAN_COLS[index]}
                className="px-4 py-3 font-semibold text-primary-600"
              >
                {ron}
              </td>
            ))}
          </tr>
        </DataTable>
      </div>
    </div>
  );
}

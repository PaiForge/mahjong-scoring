import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type Role,
  type TsumoPayment,
} from "@mahjong-scoring/core";

/**
 * 符が固定される役の点数表の形
 *
 * ツモ・ロンそれぞれの符と、列に並べる翻数を持つ。
 * 実際の値は {@link CHIITOITSU_SCORE_TABLE} / {@link PINFU_SCORE_TABLE}。
 */
export interface FixedFuTableShape {
  /** ツモ和了時の符 */
  readonly tsumoFu: number;
  /** ロン和了時の符 */
  readonly ronFu: number;
  /** 列に並べる翻数（昇順） */
  readonly hanCols: readonly number[];
}

/**
 * 符が点数に関与しなくなる翻数の1つ手前
 *
 * 5翻以上は符によらず満貫以上で頭打ちになり、符の学習から外れる。
 * 固定符の表を4翻で止めるのはこのため（満貫以上は専用の章が受け持つ）。
 */
const MAX_HAN_BEFORE_MANGAN = 4;

/** 翻数の列を `min` から満貫の手前まで並べる */
function hanColsFrom(min: number): readonly number[] {
  return Array.from(
    { length: MAX_HAN_BEFORE_MANGAN - min + 1 },
    (_, i) => min + i,
  );
}

/**
 * 七対子の点数表の形
 *
 * ツモ・ロンとも25符で変わらない。七対子は役だけで2翻あるため2翻から始まる
 * （2翻ツモの欄が空くのは、ツモなら門前清自摸和が乗って3翻以上になるため。
 * その判定は core の `isInvalidCell` が持つ）。
 */
export const CHIITOITSU_SCORE_TABLE: FixedFuTableShape = {
  tsumoFu: 25,
  ronFu: 25,
  hanCols: hanColsFrom(2),
};

/**
 * 平和の点数表の形
 *
 * ツモは副底20符のまま（ツモ符が乗らない）、ロンは門前ロンの加符が乗って30符。
 * 平和1翻のロンがありうるので1翻から始まる（1翻ツモの欄が空くのは、ツモなら
 * 門前清自摸和が乗って2翻以上になるため）。
 */
export const PINFU_SCORE_TABLE: FixedFuTableShape = {
  tsumoFu: 20,
  ronFu: 30,
  hanCols: hanColsFrom(1),
};

/** 固定符の点数表の1セル。`undefined` は存在しない符×翻の組 */
export interface FixedFuCell<T> {
  /** 列の翻数 */
  readonly han: number;
  /** その翻数での点数。存在しない組み合わせなら undefined */
  readonly score: T | undefined;
}

/** 固定符の点数表の中身（ツモ行・ロン行） */
export interface FixedFuRows {
  readonly tsumo: readonly FixedFuCell<TsumoPayment>[];
  readonly ron: readonly FixedFuCell<number>[];
}

/**
 * 符が固定される役の点数表の中身を組み立てる
 * 固定符点数表の行
 *
 * 表に出すのは翻数ごとのツモ・ロンの点数と、存在しない組み合わせ（1翻20符・
 * 2翻25符ツモ等）の空欄。どのセルが空くかは core の `isInvalidCell` が決め、
 * 章ごとに翻数の下限を書き分けない。
 *
 * 切り上げ満貫は適用しない。教本は標準ルールで書き、差分はコラムで説明する
 * （連風牌を扱う雀頭の符の章と同じ方針）。
 *
 * @param role 子・親のどちらの点数を出すか
 * @param shape 対象の役の符と翻数の並び
 */
export function buildFixedFuRows(
  role: Role,
  shape: FixedFuTableShape,
): FixedFuRows {
  const calculate = role === "ko" ? calculateKoScore : calculateOyaScore;
  const { tsumoFu, ronFu, hanCols } = shape;

  return {
    tsumo: hanCols.map((han) => ({
      han,
      score: isInvalidCell(han, tsumoFu, "tsumo")
        ? undefined
        : calculate(han, tsumoFu).tsumo,
    })),
    ron: hanCols.map((han) => ({
      han,
      score: isInvalidCell(han, ronFu, "ron")
        ? undefined
        : calculate(han, ronFu).ron,
    })),
  };
}

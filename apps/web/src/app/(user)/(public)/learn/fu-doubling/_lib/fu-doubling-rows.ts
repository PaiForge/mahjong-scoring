import {
  calculateBasePoints,
  calculateKoScore,
  calculateOyaScore,
  FU_VALUES,
  isFu,
  isInvalidCell,
  type Role,
  type WinType,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

/** 点数表のセル1つ分の計算結果（子・親で同じ形） */
type CellScore = ReturnType<typeof calculateKoScore>;

/**
 * 符と翻を指定して点数表のセルを引く。存在しない組は undefined。
 *
 * 表に出す点数を章側で書き起こさないための唯一の入口。どのセルが存在しないか
 * （20符のロン・25符1翻など）の判断は core の `isInvalidCell` に委ね、
 * 章ごとに条件を書き分けない。
 */
function scoreAt(
  fu: number,
  han: number,
  role: Role,
  winType: WinType,
): CellScore | undefined {
  if (!HAN_COLS.some((h) => h === han)) return undefined;
  if (isInvalidCell(han, fu, winType)) return undefined;
  return role === "ko" ? calculateKoScore(han, fu) : calculateOyaScore(han, fu);
}

/**
 * 符を倍にすることと翻を1つ上げることが釣り合う符の組
 *
 * `low` の2倍が `high`。点数は基本符（符 × 2 の累乗）から導かれるので、
 * 符を2倍にすることと指数を1つ増やすことは積として等しく、
 * `low` の n 翻と `high` の n-1 翻は同じ点数になる。
 */
export interface FuPair {
  readonly low: number;
  readonly high: number;
}

/**
 * 点数表の上で組になる符の一覧
 *
 * 倍にした符が表の行として実在するものだけが組になる（60符を倍にした
 * 120符は表に無い）。符の並びが変わっても追随するよう、列挙せず
 * {@link FU_VALUES} から導く。
 */
export const FU_PAIRS: readonly FuPair[] = FU_VALUES.filter((fu) =>
  isFu(fu * 2),
).map((fu) => ({ low: fu, high: fu * 2 }));

/** 符の組の表の1セル */
export interface FuPairCell {
  readonly han: number;
  /** 存在しない符×翻の組（20符のロン等）は undefined */
  readonly score: CellScore | undefined;
  /** 相方の符の行に同じ点数のセルがあるか（表で色を付けるセル） */
  readonly linked: boolean;
}

/** 符の組の表の中身（少ない符の行・その倍の符の行） */
export interface FuPairRows {
  readonly low: readonly FuPairCell[];
  readonly high: readonly FuPairCell[];
}

/**
 * 符の組を2行の点数表に組み立てる
 * 符の組の行
 *
 * 倍の符の行は、元の符の行を1翻分ずらしたものになる。その「ずれ」を
 * 目で追えるように、相方が存在するセルへ `linked` を立てて返す。色の付いた
 * 帯が2行のあいだで1列ぶんずれる形が、この章が言いたいことそのものになる。
 *
 * 満貫で頭打ちになったセルも組にはなる（40符4翻と80符3翻はどちらも満貫）。
 * 頭打ちは規則が破れたのではなく、規則の行き先が満貫に丸められた結果なので、
 * ここで組から外さない。
 *
 * @param pair 対象の符の組
 * @param role 子・親のどちらの点数を出すか
 * @param winType ツモ・ロンのどちらの点数を出すか
 */
export function buildFuPairRows(
  pair: FuPair,
  role: Role,
  winType: WinType,
): FuPairRows {
  const cell = (fu: number, han: number) => scoreAt(fu, han, role, winType);

  return {
    low: HAN_COLS.map((han) => ({
      han,
      score: cell(pair.low, han),
      linked:
        cell(pair.low, han) !== undefined &&
        cell(pair.high, han - 1) !== undefined,
    })),
    high: HAN_COLS.map((han) => ({
      han,
      score: cell(pair.high, han),
      linked:
        cell(pair.high, han) !== undefined &&
        cell(pair.low, han + 1) !== undefined,
    })),
  };
}

/** 翻を1つずつ上げたときの、切り上げ前後の点数の1行 */
export interface HanDoublingRow {
  readonly han: number;
  /** 100点単位に切り上げる前の点数。翻が1つ上がるたびにちょうど2倍になる */
  readonly beforeCeil: number;
  /** 実際に表に載る点数（切り上げ後） */
  readonly ron: number;
}

/**
 * 1つの符について、翻を上げていったときのロン点数を切り上げ前後で並べる
 * 翻ごとの倍々
 *
 * 表に載る点数（1000 → 2000 → 3900 → 7700）は100点単位への切り上げのせいで
 * 2倍から少しずれて見える。切り上げる前の値（960 → 1920 → 3840 → 7680）を
 * 隣に並べると、ずれているのは表示だけで倍々の規則自体は崩れていないことが
 * 一目で分かる。この見せ方が要るのはロンだけなので、2口に分かれるツモは
 * 扱わない。
 *
 * 満貫に届く符を渡すと途中から頭打ちになり倍々が崩れて見えるため、
 * 呼び出し側は4翻でも満貫に届かない符（30符など）を渡すこと。
 *
 * @param fu 対象の符
 * @param role 子・親のどちらの点数を出すか
 */
export function buildHanDoublingRows(
  fu: number,
  role: Role,
): readonly HanDoublingRow[] {
  const ronMultiplier = role === "ko" ? 4 : 6;

  return HAN_COLS.flatMap((han) => {
    const score = scoreAt(fu, han, role, "ron");
    if (score === undefined) return [];
    return [
      {
        han,
        beforeCeil: calculateBasePoints(han, fu) * ronMultiplier,
        ron: score.ron,
      },
    ];
  });
}

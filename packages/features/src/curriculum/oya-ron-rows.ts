import {
  calculateKoScore,
  calculateOyaScore,
  FU_VALUES,
  isInvalidCell,
  type Fu,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "../score-table/han-cols";

/** 親ロンの表の1セル */
export type OyaRonCell =
  /** 存在しない符×翻の組（25符1翻） */
  | { readonly kind: "invalid"; readonly han: number }
  /** 満貫以上。満貫は親子とも 4000 の倍数なので、1.5倍からずれることはない */
  | { readonly kind: "mangan"; readonly han: number }
  | {
      readonly kind: "score";
      readonly han: number;
      /** 親のロンの点数（表に載る値） */
      readonly oyaRon: number;
      /** 同じ符・翻の子のロンを1.5倍した値 */
      readonly koRonTimesOneAndHalf: number;
      /** 親のロンが子のロンのちょうど1.5倍にならないか（表で色を付けるセル） */
      readonly deviates: boolean;
    };

/** 親ロンの表の1行（符1つ分） */
export interface OyaRonRow {
  readonly fu: Fu;
  readonly cells: readonly OyaRonCell[];
}

/** 表の点数を出すルール */
export interface OyaRonRowsOptions {
  /** 切り上げ満貫を採るか（採ると 30符4翻・60符3翻が満貫になる） */
  readonly kiriageMangan: boolean;
}

function cellAt(
  fu: Fu,
  han: number,
  { kiriageMangan }: OyaRonRowsOptions,
): OyaRonCell {
  if (isInvalidCell(han, fu, "ron")) return { kind: "invalid", han };
  const oya = calculateOyaScore(han, fu, { kiriageMangan });
  if (oya.isMangan) return { kind: "mangan", han };
  const koRonTimesOneAndHalf = (calculateKoScore(han, fu).ron * 3) / 2;
  return {
    kind: "score",
    han,
    oyaRon: oya.ron,
    koRonTimesOneAndHalf,
    deviates: oya.ron !== koRonTimesOneAndHalf,
  };
}

/**
 * 満貫未満の親ロンの表を、子のロンの1.5倍からずれるセルの印付きで組み立てる
 * 親ロンの行
 *
 * 親のロンは基本符の6倍、子のロンは4倍で、切り上げる前なら必ず1.5倍になる。
 * ところが100点単位への切り上げは親と子に別々に効くため、表に載る数字では
 * 1.5倍から100点前後ずれるセルが出る（子 2000 → 親 2900 など）。ずれる向きは
 * 上にも下にもあり、子の点数の形から言い当てる規則は無いので、章はずれる
 * セルを「覚えるもの」として示す。その判定をここで一度だけ行う。
 *
 * 20符のロンはどの翻にも存在しないので行ごと落とす。切り上げ満貫を採ると
 * 30符4翻・60符3翻（どちらもずれるセル）が満貫になり、ずれるセルが2つ減る。
 * 章は利用者のルール設定に合わせて表と本文のマス数を出し分ける。
 */
export function buildOyaRonRows(
  options: OyaRonRowsOptions,
): readonly OyaRonRow[] {
  return FU_VALUES.map((fu) => ({
    fu,
    cells: HAN_COLS.map((han) => cellAt(fu, han, options)),
  })).filter((row) => row.cells.some((cell) => cell.kind !== "invalid"));
}

/** 親ロンの表のマス数 */
export interface OyaRonCellCounts {
  /** 満貫未満の点数が載るマス */
  readonly scored: number;
  /** そのうち子のロンの1.5倍からずれるマス */
  readonly deviating: number;
}

/**
 * 表のマス数を数える
 * 親ロンのマス数
 *
 * 章の本文（「26マスのうち14マスがずれる」）は表から数えた値を出す。
 * ルールで変わる数を辞書に書き込むと、表と本文が食い違う。
 */
export function countOyaRonCells(rows: readonly OyaRonRow[]): OyaRonCellCounts {
  const scored = rows.flatMap((row) =>
    row.cells.filter(
      (cell): cell is Extract<OyaRonCell, { kind: "score" }> =>
        cell.kind === "score",
    ),
  );
  return {
    scored: scored.length,
    deviating: scored.filter((cell) => cell.deviates).length,
  };
}

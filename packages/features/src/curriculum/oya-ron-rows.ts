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

function cellAt(fu: Fu, han: number): OyaRonCell {
  if (isInvalidCell(han, fu, "ron")) return { kind: "invalid", han };
  const oya = calculateOyaScore(han, fu);
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
 * 20符のロンはどの翻にも存在しないので行ごと落とす。点数は切り上げ満貫を
 * 採らない既定の計算で出す（採ると 30符4翻・60符3翻が満貫になり、ずれる
 * セルが2つ減る。章はそれを注記で扱う）。
 */
export function buildOyaRonRows(): readonly OyaRonRow[] {
  return FU_VALUES.map((fu) => ({
    fu,
    cells: HAN_COLS.map((han) => cellAt(fu, han)),
  })).filter((row) => row.cells.some((cell) => cell.kind !== "invalid"));
}

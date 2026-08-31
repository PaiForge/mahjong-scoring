import {
  calculateBasePoints,
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

/**
 * 子のツモ支払いを取り出す。
 *
 * `calculateKoScore` の戻り値は子ツモ・親ツモの union なので、子の計算だと
 * 分かっている箇所でも型の上では絞り込みが要る。その1回きりの手当てをここに閉じる。
 */
function koTsumoOf(
  han: number,
  fu: number,
): { readonly fromKo: number; readonly fromOya: number } {
  const { tsumo } = calculateKoScore(han, fu);
  if (tsumo.type !== "koTsumo") {
    throw new Error("calculateKoScore が子ツモ以外の支払いを返した");
  }
  return { fromKo: tsumo.fromKo, fromOya: tsumo.fromOya };
}

/** 切り上げ前と実際の支払いを並べた1行 */
export interface TsumoSplitRow {
  readonly han: number;
  /** 100点単位に切り上げる前。下段はちょうど上段の2倍になる */
  readonly beforeCeil: TsumoPayment;
  /** 実際に払う額（切り上げ後） */
  readonly actual: TsumoPayment;
}

/**
 * 子ツモの2つの数字を、切り上げ前後で並べる
 * 子ツモの内訳
 *
 * 子が払う額は基本符の1倍、親が払う額は2倍。切り上げる前を並べると
 * その比がそのまま見えるが、切り上げは上段・下段へ別々に効くため、
 * 表に載る数字では2倍にならないことがある（30符1翻の 300 と 500 など）。
 * その食い違いを見せるための行。
 *
 * 満貫に届く符を渡すと頭打ちで比が崩れて見えるため、呼び出し側は4翻でも
 * 満貫に届かない符（30符など）を渡すこと。
 *
 * @param fu 対象の符
 */
export function buildTsumoSplitRows(fu: number): readonly TsumoSplitRow[] {
  return HAN_COLS.flatMap((han) => {
    if (isInvalidCell(han, fu, "tsumo")) return [];
    const base = calculateBasePoints(han, fu);
    const { fromKo, fromOya } = koTsumoOf(han, fu);
    return [
      {
        han,
        beforeCeil: {
          type: "koTsumo",
          fromKo: base,
          fromOya: base * 2,
        } satisfies TsumoPayment,
        actual: { type: "koTsumo", fromKo, fromOya } satisfies TsumoPayment,
      },
    ];
  });
}

/** 子のツモと親のツモを突き合わせた1行 */
export interface TsumoRoleRow {
  readonly han: number;
  /** 子の和了。上段＝子ひとりから / 下段＝親から */
  readonly ko: TsumoPayment;
  /** 子の和了で親が払う額。親の和了で全員が払う額と一致する */
  readonly fromOya: number;
  /** 親の和了。全員が同額（オール） */
  readonly oya: TsumoPayment;
}

/**
 * 子のツモと親のツモを1行に並べる
 * ツモの親子対応
 *
 * 子の和了で親が払う額と、親の和了で全員が払う額は、どちらも「基本符の2倍」で
 * まったく同じ式から出る。切り上げも同じ値に効くので、表に載る数字も必ず一致する
 * （この一致は `__tests__/tsumo-payment-rows.test.ts` が全ての符×翻で固定する）。
 *
 * 一致する2つを別々の列に出すのは、章の主張を目で確かめられるようにするため。
 * 子ツモの下段を抜き出した列を挟むことで、「下段」と「親ツモのオール」が
 * 同じ数字であることを、セルの中を読み解かずに突き合わせられる。
 *
 * @param fu 対象の符
 */
export function buildTsumoRoleRows(fu: number): readonly TsumoRoleRow[] {
  return HAN_COLS.flatMap((han) => {
    if (isInvalidCell(han, fu, "tsumo")) return [];
    const { fromKo, fromOya } = koTsumoOf(han, fu);
    return [
      {
        han,
        ko: { type: "koTsumo", fromKo, fromOya } satisfies TsumoPayment,
        fromOya,
        oya: calculateOyaScore(han, fu).tsumo,
      },
    ];
  });
}

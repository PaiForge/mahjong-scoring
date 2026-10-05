import {
  calculateBasePoints,
  calculateKoScore,
  isInvalidCell,
  type Fu,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

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
export function buildTsumoSplitRows(fu: Fu): readonly TsumoSplitRow[] {
  return HAN_COLS.flatMap((han) => {
    if (isInvalidCell(han, fu, "tsumo")) return [];
    const base = calculateBasePoints(han, fu);
    const { fromKo, fromOya } = calculateKoScore(han, fu).tsumo;
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

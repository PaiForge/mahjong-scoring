import {
  calculateKoScore,
  isInvalidCell,
  type Fu,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

import { deriveKoTsumoFromRon } from "../../_lib/ko-tsumo-halving";

/** 子のロンから子ツモを導いて、実際の点数と並べた1行 */
export interface RonHalvingRow {
  readonly han: number;
  /** 出発点になる子のロン */
  readonly ron: number;
  /** {@link deriveKoTsumoFromRon} で導いた支払い */
  readonly derived: TsumoPayment;
  /** 点数表に載っている実際の支払い */
  readonly actual: TsumoPayment;
}

/**
 * 子のロンから導いた子ツモと、実際の子ツモを並べる
 * 半分ずつの内訳
 *
 * 導いた側と実際の側を別々の欄に出すのは、読者に一致を確かめさせるため。
 * 導いた値だけを見せると「表をそのまま写しただけでは」という疑いが残る。
 *
 * ロンとツモのどちらかが存在しない枠は行ごと落とす。20符はロンの欄自体が
 * 無く（平和ツモでしか出ない符）、この規則の出発点を持たない。
 *
 * @param fu 対象の符
 */
export function buildRonHalvingRows(fu: Fu): readonly RonHalvingRow[] {
  return HAN_COLS.flatMap((han) => {
    if (isInvalidCell(han, fu, "ron")) return [];
    if (isInvalidCell(han, fu, "tsumo")) return [];

    const { ron, tsumo } = calculateKoScore(han, fu);
    return [{ han, ron, derived: deriveKoTsumoFromRon(ron), actual: tsumo }];
  });
}

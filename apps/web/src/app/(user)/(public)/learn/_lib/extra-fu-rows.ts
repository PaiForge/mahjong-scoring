import { mentsuTehaiFu } from "@mahjong-scoring/core";

import {
  HAND_SHAPE_MENZEN,
  type FixedHandShape,
} from "@/app/(user)/(public)/practice/score/_lib/hand-shape-param";

/**
 * 表に並べる「積み上げた符」の上限。
 * 60符ロン（積み上げ22〜30符）まで見せれば規則は伝わるため28符で止める。
 */
const MAX_EXTRA_FU = 28;

/** 「積み上げた符 → 符」対応表の1行 */
export interface ExtraFuRow {
  /** この行がまとめる積み上げ符の下限 */
  readonly from: number;
  /** この行がまとめる積み上げ符の上限（下限と同じなら単一の値） */
  readonly to: number;
  /** ツモ和了時の符 */
  readonly tsumoFu: number;
  /** ロン和了時の符 */
  readonly ronFu: number;
}

/**
 * 「積み上げた符 → 符」対応表の行を組み立てる
 * 積み上げ符対応表
 *
 * 積み上がる符はすべて偶数（面子 4/8/16/32・雀頭 2/4・待ち 2）なので
 * 2刻みで走査し、ツモ・ロンの符がどちらも同じ並びを1行にまとめる。
 * 符そのものは core の `mentsuTehaiFu` から引くので、表に符を直書きしない。
 *
 * 門前は積み上げ0符が平和（ツモ20符・ロン30符の特例）なので2符から並べる。
 * 副露の0符は食い平和形で、こちらは特例ではなく規則どおりの30符になるため
 * 表に含める。
 *
 * @param handShape 門前手 / 副露した手のどちらの表か
 * @param maxExtraFu 表に並べる積み上げ符の上限
 */
export function buildExtraFuRows(
  handShape: FixedHandShape,
  maxExtraFu: number = MAX_EXTRA_FU,
): readonly ExtraFuRow[] {
  const isMenzen = handShape === HAND_SHAPE_MENZEN;
  const rows: ExtraFuRow[] = [];
  for (let extraFu = isMenzen ? 2 : 0; extraFu <= maxExtraFu; extraFu += 2) {
    const tsumoFu = mentsuTehaiFu(extraFu, { winType: "tsumo", isMenzen });
    const ronFu = mentsuTehaiFu(extraFu, { winType: "ron", isMenzen });
    const last = rows.at(-1);
    if (
      last !== undefined &&
      last.tsumoFu === tsumoFu &&
      last.ronFu === ronFu
    ) {
      rows[rows.length - 1] = { ...last, to: extraFu };
      continue;
    }
    rows.push({ from: extraFu, to: extraFu, tsumoFu, ronFu });
  }
  return rows;
}

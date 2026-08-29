import { menzenFu } from "@mahjong-scoring/core";

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
 * 符そのものは core の `menzenFu` から引くので、表に符を直書きしない。
 *
 * 積み上げ0符（平和）は含めない。平和はツモ20符・ロン30符の特例で、
 * この規則の外にある別の章が受け持つ。
 *
 * @param maxExtraFu 表に並べる積み上げ符の上限
 */
export function buildExtraFuRows(
  maxExtraFu: number = MAX_EXTRA_FU,
): readonly ExtraFuRow[] {
  const rows: ExtraFuRow[] = [];
  for (let extraFu = 2; extraFu <= maxExtraFu; extraFu += 2) {
    const tsumoFu = menzenFu(extraFu, "tsumo");
    const ronFu = menzenFu(extraFu, "ron");
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

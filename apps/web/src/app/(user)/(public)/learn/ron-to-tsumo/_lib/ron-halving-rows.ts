import {
  calculateKoScore,
  ceilTo100,
  isInvalidCell,
  type Fu,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

/**
 * 子のロンから子ツモの2つの支払いを導く
 * 子ツモ導出
 *
 * 子のロンは基本符の4つ分、子ツモは子が1つ分・親が2つ分。割り算だけで
 * 出る関係だが、点数表に載っているのはどれも100点単位に切り上げた後の値
 * なので、割った先で切り上げがずれない保証がいる。ずれない:
 *
 * 表のロンは真の4つ分に端数（多くても99点）が乗った値で、4で割れば
 * その端数は25点未満に縮む。より正確には、1つ分の値を100で割った余りを
 * m とすると、乗る端数はちょうど m / 4 — m は0・20・40・60・80のいずれか
 * （基本符は必ず20の倍数）なので多くても20点で、切り上げ先の100点までの
 * 余地 100 - m は少なくとも20点ある。端数が余地を越えないから、割った値は
 * 真の値と同じ100点に切り上がる。2で割る側も同じ理屈で収まる。
 *
 * 掛ける向きには成り立たない。端数が縮まずに広がるため、たとえば
 * 「親のロン ＝ 子のロンの1.5倍」は9つの枠で100点ずれる。
 *
 * ロンとツモが両方ある38の枠すべてで一致することは、このモジュールの
 * テストが固定している。
 *
 * @param koRon 表に載っている子のロンの点数
 */
export function deriveKoTsumoFromRon(koRon: number): TsumoPayment {
  const fromOya = ceilTo100(koRon / 2);
  return { type: "koTsumo", fromKo: ceilTo100(fromOya / 2), fromOya };
}

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

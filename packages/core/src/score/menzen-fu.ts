import type { WinType } from "../core/roles";

/** 符の切り上げ単位 */
const FU_STEP = 10;

/** 副底 — 和了の形に関係なく必ず付く符 */
export const FUTEI_FU = 20;

/** ツモ和了に付く符 */
export const TSUMO_AGARI_FU = 2;

/** 門前ロンに付く符（門前加符） */
export const MENZEN_RON_AGARI_FU = 10;

/**
 * 門前手の符を「積み上げた符」から求める
 * 門前手の符
 *
 * `extraFu` は面子・雀頭・待ちで積み上げた符の合計（副底と和了の符を含まない）。
 * 副底に和了の符を足し、10符単位に切り上げる符計算そのものを、教本が
 * 「積み上げた符がいくつなら何符か」の向きで引けるようにしたもの。
 *
 * @remarks
 * 平和（ツモ20符）と七対子（25符）は符を積み上げない特例なので対象外。
 * 副露している手はロンでも門前加符が付かないため、これも対象外
 * （どちらも教本では別の章が受け持つ）。
 *
 * ツモは副底20＋ツモ2＝22から、ロンは副底20＋門前加符10＝30から始まるため、
 * 同じ `extraFu` でもツモは10で切り捨てた分だけ、ロンは切り上げた分だけ
 * 30符から上がる。ロンが30符に留まるのは `extraFu` が0のとき、すなわち
 * 平和のときだけで、平和でない門前手のロンは必ず40符以上になる。
 *
 * @param extraFu 面子・雀頭・待ちで積み上げた符の合計
 * @param winType ツモ / ロン
 */
export function menzenFu(extraFu: number, winType: WinType): number {
  const agariFu = winType === "tsumo" ? TSUMO_AGARI_FU : MENZEN_RON_AGARI_FU;
  return Math.ceil((FUTEI_FU + agariFu + extraFu) / FU_STEP) * FU_STEP;
}

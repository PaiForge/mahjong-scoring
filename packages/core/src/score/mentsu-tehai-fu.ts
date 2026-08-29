import type { WinType } from "../core/roles";

/** 符の切り上げ単位 */
const FU_STEP = 10;

/** 副底 — 和了の形に関係なく必ず付く符 */
export const FUTEI_FU = 20;

/** ツモ和了に付く符 */
export const TSUMO_AGARI_FU = 2;

/** 門前ロンに付く符（門前加符） */
export const MENZEN_RON_AGARI_FU = 10;

/** 和了の形 */
interface MentsuTehaiFuContext {
  /** ツモ / ロン */
  readonly winType: WinType;
  /** 門前かどうか（副露していれば false） */
  readonly isMenzen: boolean;
}

/**
 * 面子手の符を「積み上げた符」から求める
 * 面子手の符
 *
 * `extraFu` は面子・雀頭・待ちで積み上げた符の合計（副底と和了の符を含まない）。
 * 副底に和了の符を足して10符単位に切り上げる符計算そのものを、教本が
 * 「積み上げた符がいくつなら何符か」の向きで引けるようにしたもの。
 *
 * 結果は次の3通りに畳める。ツモの符が門前でも副露でも同じなのは、
 * 門前加符がロンにしか付かないためで、その分ロンだけが門前で10符高くなる。
 *
 * - ツモ（門前・副露とも）: 30符 + `extraFu` を10で切り捨てた分
 * - 門前ロン: 30符 + `extraFu` を10で切り上げた分
 * - 副露ロン: 20符 + `extraFu` を10で切り上げた分
 *
 * @remarks
 * 七対子は面子手ではなく、符を積み上げずに25符で固定されるため対象外。
 * 平和ツモの20符（門前・ツモ・`extraFu` が0）も副底のまま据え置く特例で、
 * この関数は30符を返すため対象外。どちらも教本では別の章が受け持つ。
 *
 * 一方、食い平和形（副露・ロン・`extraFu` が0）は合計が20符になるが、
 * 20符は平和ツモ専用の符なので30符に切り上げる。こちらはこの関数が扱う。
 *
 * @param extraFu 面子・雀頭・待ちで積み上げた符の合計
 * @param context 和了の形（ツモ / ロン・門前かどうか）
 */
export function mentsuTehaiFu(
  extraFu: number,
  context: MentsuTehaiFuContext,
): number {
  const agariFu =
    context.winType === "tsumo"
      ? TSUMO_AGARI_FU
      : context.isMenzen
        ? MENZEN_RON_AGARI_FU
        : 0;
  const fu = Math.ceil((FUTEI_FU + agariFu + extraFu) / FU_STEP) * FU_STEP;
  // 副底のままの20符になるのは食い平和形だけ。20符は平和ツモ専用のため繰り上げる
  return fu === FUTEI_FU ? fu + FU_STEP : fu;
}

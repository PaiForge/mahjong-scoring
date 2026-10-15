import {
  FUTEI_FU,
  MENZEN_RON_AGARI_FU,
  TSUMO_AGARI_FU,
  mentsuTehaiFu,
  type WinType,
} from "@mahjong-scoring/core";

import {
  HAND_SHAPE_MENZEN,
  type FixedHandShape,
} from "../practice/score/hand-shape-param";

/** 例 1 つ（辞書キーと積み上げた符） */
interface TenpaneExample {
  readonly key: string;
  readonly extraFu: number;
}

/**
 * テンパネの典型例として表に並べる手
 *
 * ツモとロンで出発点が違い、テンパネする場所も違うので、例は和了り方ごとに
 * 選ぶ。どの表も「2符だけ」「ちょうど10の倍数になる手」「テンパネして1段
 * 上がる手」が並ぶようにしている。鳴いた手は槓子の例を明槓にする。
 * 鳴いた手の積み上げ0符のロン（食い平和形）は規則の例外なので表に載せず、
 * 章のコラムが受け持つ。
 */
const TENPANE_EXAMPLES = {
  menzen: {
    ron: [
      { key: "two", extraFu: 2 },
      { key: "yaochuAnkouPlusTwo", extraFu: 10 },
      { key: "yaochuAnkouChunchanAnkou", extraFu: 12 },
      { key: "yaochuAnkan", extraFu: 32 },
    ],
    tsumo: [
      { key: "two", extraFu: 2 },
      { key: "yaochuAnkou", extraFu: 8 },
      { key: "yaochuAnkouPlusTwo", extraFu: 10 },
      { key: "chunchanAnkan", extraFu: 16 },
    ],
  },
  furo: {
    ron: [
      { key: "two", extraFu: 2 },
      { key: "yaochuAnkouPlusTwo", extraFu: 10 },
      { key: "yaochuAnkouChunchanAnkou", extraFu: 12 },
      { key: "yaochuMinkan", extraFu: 16 },
    ],
    tsumo: [
      { key: "two", extraFu: 2 },
      { key: "yaochuAnkou", extraFu: 8 },
      { key: "yaochuAnkouPlusTwo", extraFu: 10 },
      { key: "yaochuMinkan", extraFu: 16 },
    ],
  },
} as const satisfies Record<
  FixedHandShape,
  Record<WinType, readonly TenpaneExample[]>
>;

/** テンパネの典型例の表の1行 */
export interface TenpaneRow {
  /** 例の辞書キー（`learnCurriculum.tenpaneExamples.<key>`） */
  readonly key: string;
  /** 面子・雀頭・待ちで積み上げた符 */
  readonly extraFu: number;
  /** 副底と和了り方の符の合計（門前ロン30符 / 副露ロン20符 / ツモ22符） */
  readonly startFu: number;
  /** 切り上げ前の合計 */
  readonly totalFu: number;
  /** 切り上げた後の符 */
  readonly fu: number;
}

/**
 * 面子手で、符がテンパネする典型例の表の行を組み立てる
 * テンパネ典型例
 *
 * 副底・和了り方の符・積み上げた符を足して10符単位に切り上げる、という
 * 数え方をそのまま見せる表。符は core の `mentsuTehaiFu` から引くので、
 * 表に符を直書きしない。`totalFu === fu` の行がテンパネしない（ちょうどの）行。
 *
 * @param handShape 門前手 / 副露した手のどちらの表か
 * @param winType ツモ / ロンのどちらの表か
 */
export function buildTenpaneRows(
  handShape: FixedHandShape,
  winType: WinType,
): readonly TenpaneRow[] {
  const isMenzen = handShape === HAND_SHAPE_MENZEN;
  const agariFu =
    winType === "tsumo" ? TSUMO_AGARI_FU : isMenzen ? MENZEN_RON_AGARI_FU : 0;
  const startFu = FUTEI_FU + agariFu;
  return TENPANE_EXAMPLES[handShape][winType].map(({ key, extraFu }) => ({
    key,
    extraFu,
    startFu,
    totalFu: startFu + extraFu,
    fu: mentsuTehaiFu(extraFu, { winType, isMenzen }),
  }));
}

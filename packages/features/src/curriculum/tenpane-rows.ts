import {
  FUTEI_FU,
  MENZEN_RON_AGARI_FU,
  TSUMO_AGARI_FU,
  mentsuTehaiFu,
  type WinType,
} from "@mahjong-scoring/core";

/**
 * テンパネの典型例として表に並べる手（辞書キーと積み上げた符）
 *
 * ツモとロンで出発点（22符 / 30符）が違い、テンパネする場所も違うので、
 * 例は和了り方ごとに選ぶ。どちらも「2符だけ」「ちょうど10の倍数になる手」
 * 「テンパネして1段上がる手」が並ぶようにしている。
 */
const TENPANE_EXAMPLES = {
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
} as const satisfies Record<
  WinType,
  readonly { readonly key: string; readonly extraFu: number }[]
>;

/** テンパネの典型例の表の1行 */
export interface TenpaneRow {
  /** 例の辞書キー（`menzenMentsuScore.learn.tenpaneExamples.<key>`） */
  readonly key: string;
  /** 面子・雀頭・待ちで積み上げた符 */
  readonly extraFu: number;
  /** 副底と和了り方の符の合計（ロン30符 / ツモ22符） */
  readonly startFu: number;
  /** 切り上げ前の合計 */
  readonly totalFu: number;
  /** 切り上げた後の符 */
  readonly fu: number;
}

/**
 * 門前の面子手で、符がテンパネする典型例の表の行を組み立てる
 * テンパネ典型例
 *
 * 副底・和了り方の符・積み上げた符を足して10符単位に切り上げる、という
 * 数え方をそのまま見せる表。符は core の `mentsuTehaiFu` から引くので、
 * 表に符を直書きしない。`totalFu === fu` の行がテンパネしない（ちょうどの）行。
 *
 * @param winType ツモ / ロンのどちらの表か
 */
export function buildTenpaneRows(winType: WinType): readonly TenpaneRow[] {
  const startFu =
    FUTEI_FU + (winType === "tsumo" ? TSUMO_AGARI_FU : MENZEN_RON_AGARI_FU);
  return TENPANE_EXAMPLES[winType].map(({ key, extraFu }) => ({
    key,
    extraFu,
    startFu,
    totalFu: startFu + extraFu,
    fu: mentsuTehaiFu(extraFu, { winType, isMenzen: true }),
  }));
}

import type { MachiType } from "@pai-forge/riichi-mahjong";

/**
 * 待ちの形ごとの待ち符
 * 待ち符表
 *
 * 嵌張・辺張・単騎は受け入れが狭い待ちとして 2 符、両面・双碰は 0 符。
 * ノベタンは単騎として扱う（形の分類はライブラリの `classifyMachi`）。
 */
const MACHI_FU: Readonly<Record<MachiType, number>> = {
  Ryanmen: 0,
  Shanpon: 0,
  Kanchan: 2,
  Penchan: 2,
  Tanki: 2,
};

/**
 * 待ちの形から待ち符を返す
 * 待ち符計算
 *
 * @param machiType 待ちの形
 */
export function calculateMachiFu(machiType: MachiType): number {
  return MACHI_FU[machiType];
}

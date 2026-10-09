import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 手牌の並びを決める、ブロック（面子・雀頭）の見え方
 * 手牌ブロック配置
 */
export interface HandLayoutBlock {
  /** ブロックの牌 */
  readonly tiles: readonly HaiKindId[];
  /** 手牌の右に晒すか（副露・暗槓） */
  readonly isExposed: boolean;
}

/** 牌の配列同士を、それぞれ昇順に並べたうえで辞書順に比べる */
function compareTilesAsc(
  a: readonly HaiKindId[],
  b: readonly HaiKindId[],
): number {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  const len = Math.min(sa.length, sb.length);
  for (let i = 0; i < len; i++) {
    if (sa[i] !== sb[i]) return sa[i] - sb[i];
  }
  return sa.length - sb.length;
}

/**
 * 面子・雀頭を、手牌の左から右の並びの順に並べ替える
 * 手牌レイアウト整列
 *
 * 手牌は「理牌した純手牌 → 晒した面子」の順に並ぶ。理牌は牌種 ID の昇順で、
 * ID は萬子 → 筒子 → 索子 → 字牌（東南西北白發中）の順に振られている
 * （finalizeTehai14 / finalizeTehai13）。そこで手の内のブロックを牌の昇順に、
 * 晒したブロックをその後に元の順で置く。手牌から面子を切り出して見せる表
 * （面子・雀頭符の回答行、面子分解）はどれもこれで並べ、手牌と同じ並びにする。
 * 同じ牌のブロック（同じ順子が 2 つ等）は元の順を保つ。
 *
 * @param describe - ブロックの牌と、晒すかどうかを返す
 */
export function orderByHandLayout<T>(
  blocks: readonly T[],
  describe: (block: T) => HandLayoutBlock,
): T[] {
  const closed = blocks.filter((block) => !describe(block).isExposed);
  const exposed = blocks.filter((block) => describe(block).isExposed);
  const sortedClosed = [...closed].sort((a, b) =>
    compareTilesAsc(describe(a).tiles, describe(b).tiles),
  );
  return [...sortedClosed, ...exposed];
}

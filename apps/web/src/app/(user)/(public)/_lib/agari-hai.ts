import type { HaiKindId } from "@mahjong-scoring/core";

/** 純手牌と、そこから切り離した和了牌 */
export interface SplitTehai {
  /** 和了牌を除いた純手牌 */
  readonly closedTiles: readonly HaiKindId[];
  /** 右に離して開示する和了牌。和了牌の指定が無いときだけ undefined */
  readonly separatedAgariHai: HaiKindId | undefined;
}

/**
 * 純手牌から和了牌を 1 枚切り離す
 * 和了牌分離
 *
 * 実卓と同じく和了牌を手牌の右へ離して開示するための分割。同じ牌が複数
 * あってもどれを抜いても見た目は変わらないため、末尾側の 1 枚を抜く。
 *
 * 和了牌が純手牌に無いという不整合な手牌でも、和了牌は開示する側に返す。
 * 手牌が 1 枚多く見えるのは目に付くが、和了牌を落とすと出題として成立しない。
 *
 * @param closed - 理牌済みの純手牌（和了牌を含む）
 * @param agariHai - 和了牌。省略時は分離しない
 */
export function splitAgariHai(
  closed: readonly HaiKindId[],
  agariHai: HaiKindId | undefined,
): SplitTehai {
  if (agariHai === undefined) {
    return { closedTiles: closed, separatedAgariHai: undefined };
  }

  const index = closed.lastIndexOf(agariHai);
  if (index === -1) {
    return { closedTiles: closed, separatedAgariHai: agariHai };
  }

  return {
    closedTiles: [...closed.slice(0, index), ...closed.slice(index + 1)],
    separatedAgariHai: agariHai,
  };
}

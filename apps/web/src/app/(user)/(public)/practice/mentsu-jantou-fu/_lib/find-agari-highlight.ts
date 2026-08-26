import { MentsuType } from "@mahjong-scoring/core";
import type { MentsuJantouFuQuestion } from "@mahjong-scoring/core";

/**
 * 和了牌を示す回答行と、その行の何枚目か
 * 和了牌ハイライト位置
 */
export interface AgariHighlight {
  readonly itemId: string;
  readonly tileIndex: number;
}

/**
 * 和了牌を回答行のどの牌に示すかを求める
 * 和了牌ハイライト算出
 *
 * 手牌表示では和了牌を離して枠で囲うが、回答行は面子ごとに牌を並べ直すため、
 * 同じ枠を付けないとどの要素で和了したのかが読めない。ロンで完成した刻子は
 * 明刻になり符が半分になるので、この対応は符の答えに直結する。
 *
 * 副露と槓子は和了牌になり得ないため対象外。同じ牌種が複数の要素にまたがる手
 * （暗刻とその牌を含む順子など）では、どちらを完成させたのかが手牌から
 * 決まらないため、どこにも付けない。
 */
export function findAgariHighlight(
  question: MentsuJantouFuQuestion,
): AgariHighlight | undefined {
  const { agariHai } = question.context;
  const holders = question.items.filter(
    (item) =>
      !item.isOpen &&
      item.type !== MentsuType.Kantsu &&
      item.tiles.includes(agariHai),
  );
  if (holders.length !== 1) return undefined;

  const [item] = holders;
  // 刻子は3枚とも同じ牌なので、実卓で和了牌を末尾に足す並びに合わせて右端に付ける
  return { itemId: item.id, tileIndex: item.tiles.lastIndexOf(agariHai) };
}

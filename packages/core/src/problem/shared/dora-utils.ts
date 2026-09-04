import type { HaiKindId } from "@pai-forge/riichi-mahjong";
import {
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { validateHaiKindId } from "../../core/type-guards";

/** 牌種の総数（萬子・筒子・索子 各9 + 字牌7） */
const HAI_KIND_COUNT = 34;

/** 同じ牌種の最大枚数 */
const MAX_PER_KIND = 4;

/**
 * ドラ表示牌をランダムに生成する
 * ドラ表示牌生成
 *
 * 表示牌も山から取る 1 枚なので、すでに 4 枚使われている牌種は選ばない。
 * 除外しないと「五筒を暗槓しているのにドラ表示牌も五筒」のような、牌が
 * 5 枚要る盤面が出る（手牌側は `validateTehai14` が弾くが、表示牌は手牌の
 * 外なので誰も見ていない）。
 *
 * @param kantsuCount - 槓子の数（ドラ表示牌の数 = 1 + 槓子数）
 * @param used - すでに使われている牌。手牌の全牌と、先に決めた表示牌を渡す
 *   （裏ドラは表ドラの下に伏せてある別の牌なので、表ドラも使用済みに含める）
 * @param rng - 乱数供給源（既定 `Math.random`）
 * @returns ドラ表示牌。使える牌が尽きた場合は undefined
 */
export function generateDoraMarkers(
  kantsuCount: number,
  used: readonly HaiKindId[],
  rng: RandomSource = defaultRandomSource,
): HaiKindId[] | undefined {
  const counts = new Array<number>(HAI_KIND_COUNT).fill(0);
  for (const hai of used) counts[hai] += 1;

  const markers: HaiKindId[] = [];

  for (let i = 0; i < 1 + kantsuCount; i++) {
    const candidates: HaiKindId[] = [];
    for (let kind = 0; kind < HAI_KIND_COUNT; kind++) {
      if (counts[kind] >= MAX_PER_KIND) continue;
      const result = validateHaiKindId(kind);
      if (result.isOk()) candidates.push(result.value);
    }
    if (candidates.length === 0) return undefined;

    const marker = randomChoice(candidates, rng);
    counts[marker] += 1;
    markers.push(marker);
  }

  return markers;
}

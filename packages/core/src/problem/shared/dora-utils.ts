import type { HaiKindId, Tehai14 } from "@pai-forge/riichi-mahjong";
import { listTehaiHais } from "../../core/hai-count";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { defaultRandomSource, type RandomSource } from "../../core/random";
import { countKantsu } from "./count-kantsu";
import { pickAvailableHai } from "./tile-random";

/**
 * 出題盤面に出すドラ表示牌の一式
 * ドラ表示牌
 */
export interface DoraMarkers {
  readonly doraMarkers: readonly HaiKindId[];
  /** 裏ドラ表示牌。リーチしている手だけが持つ */
  readonly uraDoraMarkers?: readonly HaiKindId[];
}

/**
 * 手牌に対するドラ表示牌（リーチなら裏ドラ表示牌も）を生成する
 * ドラ表示牌生成
 *
 * 表示牌の枚数は 1 + 槓子数（カン 1 回につき新ドラが 1 枚めくられる）。
 * 裏ドラは表ドラの下に伏せてある同数の別の牌で、リーチしている手だけがめくる。
 *
 * 表示牌も山から取る 1 枚なので、手牌が使い切った牌種は選ばない。除外しないと
 * 「五筒を暗槓しているのにドラ表示牌も五筒」のような、牌が 5 枚要る盤面が出る
 * （手牌側は `validateTehai14` が弾くが、表示牌は手牌の外なので誰も見ていない）。
 * 表ドラを引いたぶんも数に入れたうえで裏ドラを引くため、表と裏を通しても
 * 4 枚を超えない。
 *
 * @param tehai - 出題する手牌（副露・槓子を含む）
 * @param isRiichi - リーチしている手か。真なら裏ドラ表示牌も返す
 * @param rng - 乱数供給源（既定 `Math.random`）
 * @returns 表示牌の一式。使える牌が尽きた場合は undefined
 */
export function generateDoraMarkers(
  tehai: Tehai14,
  isRiichi: boolean,
  rng: RandomSource = defaultRandomSource,
): DoraMarkers | undefined {
  // 山の残りを手牌から起こす。Tehai14 は牌の枚数を検証済みなので登録は
  // 失敗しないはずだが、握り潰さず生成を諦める（手牌生成側と同じ作法）
  const wall = new HaiUsageTracker();
  for (const hai of listTehaiHais(tehai)) {
    if (wall.use(hai).isErr()) return undefined;
  }

  const markerCount = 1 + countKantsu(tehai);
  const draw = (): HaiKindId[] | undefined => {
    const markers: HaiKindId[] = [];
    for (let i = 0; i < markerCount; i++) {
      const marker = pickAvailableHai(wall, 1, rng);
      if (marker === undefined) return undefined;
      markers.push(marker);
    }
    return markers;
  };

  const doraMarkers = draw();
  if (!doraMarkers) return undefined;
  if (!isRiichi) return { doraMarkers };

  const uraDoraMarkers = draw();
  if (!uraDoraMarkers) return undefined;
  return { doraMarkers, uraDoraMarkers };
}

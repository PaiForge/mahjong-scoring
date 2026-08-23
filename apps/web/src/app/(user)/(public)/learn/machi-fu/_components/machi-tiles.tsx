import type { HaiKindId } from "@mahjong-scoring/core";
import { TileSet } from "../../_components/tile-set";

/** 5枚並ぶ双碰待ちでも表の幅に収まる大きさ */
const MACHI_TILE_SIZE = "xs";

interface MachiTilesProps {
  /** 聴牌時に手の内にある牌 */
  readonly tiles: readonly HaiKindId[];
  /** 和了牌 */
  readonly agariHai: HaiKindId;
}

/**
 * 待ちの例示牌（手の内 ＋ 和了牌）
 * 待ち例示牌
 *
 * 待ちの符は「どの形にどの牌が来たか」で決まるため、他章の例示と違って
 * 手の内と和了牌を分けて示す。
 *
 * 双碰待ちは対子2組＋和了牌で5枚並ぶため、他章より一段小さい牌で描く。
 * 揃えないと表の「種類」列が潰れて1文字ずつ折り返す。
 */
export function MachiTiles({ tiles, agariHai }: MachiTilesProps) {
  return (
    <div className="flex items-center gap-1.5">
      <TileSet tiles={tiles} size={MACHI_TILE_SIZE} />
      <span className="text-xs text-surface-400">+</span>
      <TileSet tiles={[agariHai]} size={MACHI_TILE_SIZE} />
    </div>
  );
}

import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 数値が有効な HaiKindId（0-33）かどうかを判定する型ガード
 * 牌種ID型ガード
 */
export function isHaiKindId(value: number): value is HaiKindId {
  return Number.isInteger(value) && value >= 0 && value <= 33;
}

import { ok, err, type Result } from "neverthrow";
import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 数値が有効な HaiKindId（0-33）かどうかを判定する型ガード
 * 牌種ID型ガード
 */
export function isHaiKindId(value: number): value is HaiKindId {
  return Number.isInteger(value) && value >= 0 && value <= 33;
}

/**
 * 数値が有効な牌種ID（0-33）かどうかを検証するスマートコンストラクタ
 * 牌種IDバリデーション
 */
export function validateHaiKindId(value: number): Result<HaiKindId, RangeError> {
  if (!isHaiKindId(value)) {
    return err(new RangeError(`Invalid HaiKindId: ${value}. Expected integer in range 0-33.`));
  }
  return ok(value);
}

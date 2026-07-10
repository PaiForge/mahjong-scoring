import {
  HaiKind,
  type HaiKindId,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { ok, type Result } from "neverthrow";
import { validateHaiKindId } from "./type-guards";
import { countHaiInTehai } from "./hai-count";

/**
 * ドラ算出用の牌種グループ範囲（[先頭, 末尾]）。
 * 末尾の表示牌はグループ先頭にループする。
 * 牌種グループ範囲
 */
const INDICATOR_RANGES: readonly (readonly [HaiKindId, HaiKindId])[] = [
  [HaiKind.ManZu1, HaiKind.ManZu9],
  [HaiKind.PinZu1, HaiKind.PinZu9],
  [HaiKind.SouZu1, HaiKind.SouZu9],
  [HaiKind.Ton, HaiKind.Pei],
  [HaiKind.Haku, HaiKind.Chun],
];

/**
 * ドラ表示牌からドラを計算する
 * ドラ算出
 */
export function getDoraFromIndicator(
  indicator: HaiKindId,
): Result<HaiKindId, RangeError> {
  for (const [start, end] of INDICATOR_RANGES) {
    if (indicator >= start && indicator <= end) {
      const next = indicator === end ? start : indicator + 1;
      return validateHaiKindId(next);
    }
  }
  return ok(indicator);
}

/**
 * 手牌中のドラ枚数をカウントする
 * ドラ枚数カウント
 */
export function countDoraInTehai(
  tehai: Tehai14,
  markers: readonly HaiKindId[],
): number {
  let count = 0;
  for (const marker of markers) {
    const doraResult = getDoraFromIndicator(marker);
    if (doraResult.isErr()) continue;
    count += countHaiInTehai(tehai, doraResult.value);
  }
  return count;
}

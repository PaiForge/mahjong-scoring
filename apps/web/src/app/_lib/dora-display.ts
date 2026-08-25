import { getDoraFromIndicator } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

/**
 * ドラの表示方法
 *
 * 出題データが持つのはどちらのモードでも「ドラ表示牌」で、変わるのは描画だけ。
 * 正解判定は常に表示牌から導いたドラで行うため、この設定は答えを変えない。
 *
 * - `indicator` — 実際の麻雀と同じく表示牌を出す（既定）
 * - `actual` — 表示牌から 1 つ進めた「ドラそのもの」を出す
 */
export type DoraDisplayMode = "indicator" | "actual";

/** 実際の麻雀と同じ見え方を既定にする */
export const DEFAULT_DORA_DISPLAY_MODE: DoraDisplayMode = "indicator";

/**
 * ドラ表示牌の並びを、表示モードに応じて実際に描画する牌へ変換する
 *
 * 表示牌からドラを導けない牌（想定外の id）は描画対象から落とす。
 */
export function resolveDoraTiles(
  markers: readonly HaiKindId[],
  mode: DoraDisplayMode,
): readonly HaiKindId[] {
  if (mode === "indicator") return markers;

  return markers.flatMap((marker) => {
    const dora = getDoraFromIndicator(marker);
    return dora.isOk() ? [dora.value] : [];
  });
}

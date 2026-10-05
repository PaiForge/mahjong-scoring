import { getDoraNext } from "@mahjong-scoring/core";
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
 * 表示牌からドラを導く規則（9 の次は 1、北の次は東、中の次は白）は
 * ライブラリの `getDoraNext` に委ね、正解判定側と同じ計算を使う。
 */
export function resolveDoraTiles(
  markers: readonly HaiKindId[],
  mode: DoraDisplayMode,
): readonly HaiKindId[] {
  if (mode === "indicator") return markers;

  return markers.map(getDoraNext);
}

/**
 * 手牌の状況行に並べるドラ・裏ドラ
 * 盤面ドラ
 */
export interface BoardDora {
  readonly doraTiles: readonly HaiKindId[];
  /** リーチしていない出題では空 */
  readonly uraDoraTiles: readonly HaiKindId[];
}

/**
 * 出題の表示牌から、状況行に並べるドラ・裏ドラを表示モードどおりに引く
 * 盤面ドラ解決
 *
 * 裏ドラはリーチしている出題でのみ見せる。ここで空にしておくことで、
 * 描画の有無と状況行の高さ計算が同じ条件を見る。
 *
 * @param context 出題のドラ表示牌とリーチの有無
 * @param mode ドラの表示モード（表示牌 / ドラそのもの）
 */
export function resolveBoardDora(
  context: {
    readonly doraMarkers?: readonly HaiKindId[];
    readonly uraDoraMarkers?: readonly HaiKindId[];
    readonly isRiichi?: boolean;
  },
  mode: DoraDisplayMode,
): BoardDora {
  return {
    doraTiles: resolveDoraTiles(context.doraMarkers ?? [], mode),
    uraDoraTiles: context.isRiichi
      ? resolveDoraTiles(context.uraDoraMarkers ?? [], mode)
      : [],
  };
}

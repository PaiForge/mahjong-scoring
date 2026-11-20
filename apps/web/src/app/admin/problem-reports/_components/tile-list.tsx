"use client";

import { isHaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";

/**
 * 牌種 ID の列を牌の画像で並べる（管理画面用）
 * 牌の列
 *
 * 保存した盤面（jsonb）の値は牌種 ID のはずだが、範囲外の値が入っていても
 * 落とさずに数値のまま出す（報告の調査で、壊れた盤面そのものが手掛かりになる）。
 * `alt` は牌の名前（`Hai` の既定）。
 */
export function TileList({ hais }: { readonly hais: readonly number[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {hais.map((hai, i) =>
        isHaiKindId(hai) ? (
          <Hai key={i} hai={hai} size="xs" />
        ) : (
          <span key={i} className="font-mono text-xs text-red-700">
            {String(hai)}
          </span>
        ),
      )}
    </span>
  );
}

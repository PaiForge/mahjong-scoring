"use client";

import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiDisplay } from "../../_components/tehai-display";
import { DEMO_FU_CONTEXT, DEMO_FU_TEHAI } from "../../_lib/demo-tehai";
import { FU_OPTIONS } from "../../_lib/fu-options";

/**
 * デモ用の固定例（{@link DEMO_FU_TEHAI}）の各要素の牌
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
const DEMO_ITEMS: readonly (readonly HaiKindId[])[] = [
  [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
  [HaiKind.PinZu5, HaiKind.PinZu6, HaiKind.PinZu7],
  [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
  [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8],
  [HaiKind.Nan, HaiKind.Nan],
];

/**
 * 面子と雀頭の符計算の「問題方式」ビジュアルデモ
 * 面子・雀頭符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と要素ごとの符入力）を、出題時（未回答）のまま
 * 静的に再現する。各行の体裁は盤面の
 * {@link import("./fu-item-row").FuItemRow} の未入力時に合わせる。
 */
export function MentsuJantouFuHowToPlay() {
  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      {/* 要素ごとの符入力（未入力の状態） */}
      <div className="space-y-2">
        {DEMO_ITEMS.map((tiles, i) => (
          <div
            key={i}
            className="space-y-2.5 rounded-xl border border-surface-200 bg-white p-3"
          >
            <div className="flex gap-0.5">
              {tiles.map((tile, j) => (
                <Hai key={j} hai={tile} size="sm" />
              ))}
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {FU_OPTIONS.map((fu) => (
                <div
                  key={fu}
                  className="rounded-lg border border-surface-200 bg-white py-2.5 text-center text-sm font-bold text-surface-600"
                >
                  {fu}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

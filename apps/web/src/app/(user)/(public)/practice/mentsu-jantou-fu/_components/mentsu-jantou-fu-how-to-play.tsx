"use client";

import { HaiKind, MentsuType } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiDisplay } from "../../_components/tehai-display";
import { DEMO_FU_CONTEXT, DEMO_FU_TEHAI } from "../../_lib/demo-tehai";
import { FU_OPTIONS } from "../../_lib/fu-options";
import {
  findAgariHighlight,
  type AgariHighlightItem,
} from "../_lib/find-agari-highlight";

/**
 * デモ用の固定例（{@link DEMO_FU_TEHAI}）の各要素
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
const DEMO_ITEMS: readonly AgariHighlightItem[] = [
  {
    id: "234m",
    tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "567p",
    tiles: [HaiKind.PinZu5, HaiKind.PinZu6, HaiKind.PinZu7],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "chun",
    tiles: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
    type: MentsuType.Koutsu,
    isOpen: false,
  },
  {
    id: "678s",
    tiles: [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "nan",
    tiles: [HaiKind.Nan, HaiKind.Nan],
    type: "Pair",
    isOpen: false,
  },
];

/** デモの和了牌（七筒ツモ）を示す位置。出題盤面と同じ判定から求める */
const DEMO_AGARI_HIGHLIGHT = findAgariHighlight(
  DEMO_ITEMS,
  DEMO_FU_CONTEXT.agariHai,
);

/**
 * 面子と雀頭の符計算の「問題方式」ビジュアルデモ
 * 面子・雀頭符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と要素ごとの符入力）を、出題時（未回答）のまま
 * 静的に再現する。各行の体裁は盤面の
 * {@link import("./fu-item-row").FuItemRow} の未入力時に合わせる。
 *
 * 和了牌の枠も盤面と同じ判定（{@link findAgariHighlight}）から出す。デモは
 * 押せない静的な再現なので行の markup は持たせているが、どの牌に枠が付くかを
 * ここで別に決めると盤面と食い違う。
 */
export function MentsuJantouFuHowToPlay() {
  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      {/* 要素ごとの符入力（未入力の状態） */}
      <div className="space-y-2">
        {DEMO_ITEMS.map((item) => (
          <div
            key={item.id}
            className="space-y-2.5 rounded-xl border border-surface-200 bg-white p-3"
          >
            <div className="flex gap-0.5">
              {item.tiles.map((tile, j) => (
                <Hai
                  key={j}
                  hai={tile}
                  size="sm"
                  highlighted={
                    DEMO_AGARI_HIGHLIGHT?.itemId === item.id &&
                    DEMO_AGARI_HIGHLIGHT.tileIndex === j
                  }
                />
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

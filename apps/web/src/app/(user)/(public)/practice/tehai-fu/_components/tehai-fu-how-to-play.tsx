"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId, Tehai14 } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { CheckIcon } from "@/app/_components/icons/check-icon";
import { TehaiDisplay } from "../../_components/tehai-display";

/**
 * デモ用の固定例: 東場・南家・ツモ
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭) の各符を答える。
 */
// Tehai14 はブランド型のため、リポジトリのテスト同様 as unknown as で静的構築する
// （TehaiDisplay は closed/exposed の描画にのみ使用するため検証は不要）
const DEMO_TEHAI = {
  closed: [
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.PinZu5,
    HaiKind.PinZu6,
    HaiKind.PinZu7,
    HaiKind.Chun,
    HaiKind.Chun,
    HaiKind.Chun,
    HaiKind.SouZu6,
    HaiKind.SouZu7,
    HaiKind.SouZu8,
    HaiKind.Nan,
    HaiKind.Nan,
  ],
  exposed: [],
} as unknown as Tehai14;

const DEMO_CONTEXT = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.PinZu7,
  isTsumo: true,
} as const;

/** 各要素の牌と正解の符 */
const DEMO_ITEMS: readonly { tiles: readonly HaiKindId[]; fu: number }[] = [
  { tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4], fu: 0 },
  { tiles: [HaiKind.PinZu5, HaiKind.PinZu6, HaiKind.PinZu7], fu: 0 },
  { tiles: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun], fu: 8 },
  { tiles: [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8], fu: 0 },
  { tiles: [HaiKind.Nan, HaiKind.Nan], fu: 2 },
];

/**
 * 手牌符練習の「問題方式」ビジュアルデモ
 * 手牌符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と要素ごとの符入力）を静的に再現し、
 * 各要素の正解の符をハイライトしてプレイ方法を端的に示す。
 */
export function TehaiFuHowToPlay() {
  const t = useTranslations("tehaiFu");

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={DEMO_TEHAI}
        context={DEMO_CONTEXT}
        translationNamespace="tehaiFu"
      />

      {/* 要素ごとの符（正解をハイライト） */}
      <div className="space-y-2">
        {DEMO_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-green-500 bg-green-50 p-3"
          >
            <div className="flex gap-0.5">
              {item.tiles.map((tile, j) => (
                <Hai key={j} hai={tile} size="sm" />
              ))}
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-bold text-green-700">
              <span className="flex size-4 items-center justify-center rounded-full bg-green-500">
                <CheckIcon className="size-2.5 text-white" />
              </span>
              {t("fuSuffix", { value: item.fu })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { TehaiDisplay } from "../../_components/tehai-display";
import { DEMO_FU_CONTEXT, DEMO_FU_TEHAI } from "../../_lib/demo-tehai";

/**
 * デモ用の固定例（{@link DEMO_FU_TEHAI}）の各要素の牌と正解の符
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
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
        tehai={DEMO_FU_TEHAI}
        context={DEMO_FU_CONTEXT}
        translationNamespace="tehaiFu"
      />

      {/* 要素ごとの符（正解をハイライト） */}
      <div className="space-y-2">
        {DEMO_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border-3 border-ink bg-primary-50 p-3"
          >
            <div className="flex gap-0.5">
              {item.tiles.map((tile, j) => (
                <Hai key={j} hai={tile} size="sm" />
              ))}
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-bold text-primary-700">
              <span className="flex size-4 items-center justify-center rounded-full bg-primary-500">
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

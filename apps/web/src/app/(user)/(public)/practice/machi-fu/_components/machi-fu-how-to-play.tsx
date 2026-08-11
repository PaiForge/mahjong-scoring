"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { DemoChoiceCell } from "../../_components/demo-choice-cell";

/** デモ用の固定例: 嵌張待ち（二萬・四萬で三萬待ち） → 2符 */
const DEMO_TILES: readonly HaiKindId[] = [HaiKind.ManZu2, HaiKind.ManZu4];
const DEMO_AGARI: HaiKindId = HaiKind.ManZu3;
const DEMO_ANSWER = 2;
const DEMO_FU_CHOICES = [0, 2] as const;

/**
 * 待ち符練習の「問題方式」ビジュアルデモ
 * 待ち符 遊び方デモ
 *
 * 実際の出題盤面（待ち形・和了牌の提示と2択）を静的に再現し、
 * 正解の符をハイライトしてプレイ方法を端的に示す。
 */
export function MachiFuHowToPlay() {
  const t = useTranslations("machiFu");

  return (
    <div className="space-y-5">
      {/* Machi tiles / agari */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("machiLabel")}
          </span>
          <div className="flex gap-0.5 scale-125 origin-center">
            {DEMO_TILES.map((tile, i) => (
              <Hai key={i} hai={tile} />
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-surface-100" />

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("agariLabel")}
          </span>
          <div className="scale-125 origin-center">
            <Hai hai={DEMO_AGARI} />
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <div className="grid grid-cols-2 gap-3">
        {DEMO_FU_CHOICES.map((fu) => {
          const isCorrect = fu === DEMO_ANSWER;
          return (
            <DemoChoiceCell
              key={fu}
              isCorrect={isCorrect}
              className={`text-2xl font-bold ${isCorrect ? "text-green-700" : "text-surface-400"}`}
            >
              {t("fuOption", { value: fu })}
            </DemoChoiceCell>
          );
        })}
      </div>
    </div>
  );
}

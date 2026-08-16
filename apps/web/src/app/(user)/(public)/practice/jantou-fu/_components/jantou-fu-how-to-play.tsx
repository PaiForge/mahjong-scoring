"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { DemoChoiceCell } from "../../_components/demo-choice-cell";
import { JantouFuKazeContext } from "./jantou-fu-kaze-context";

/** デモ用の固定例: 東場・南家。正解は中（三元牌 → 2符） */
const DEMO_CHOICES: readonly { hai: HaiKindId; isCorrect: boolean }[] = [
  { hai: HaiKind.PinZu5, isCorrect: false },
  { hai: HaiKind.Chun, isCorrect: true },
  { hai: HaiKind.Sha, isCorrect: false },
  { hai: HaiKind.SouZu3, isCorrect: false },
];

/**
 * 雀頭符練習の「問題方式」ビジュアルデモ
 * 雀頭符 遊び方デモ
 *
 * 実際の出題盤面（場風・自風の提示と4択）を静的に再現し、
 * 正解の牌をハイライトしてプレイ方法を端的に示す。
 */
export function JantouFuHowToPlay() {
  const t = useTranslations("jantouFu");

  return (
    <div className="space-y-5">
      {/* Context */}
      <JantouFuKazeContext bakaze={HaiKind.Ton} jikaze={HaiKind.Nan} />

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectCorrectHead")}
      </p>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {DEMO_CHOICES.map((choice, i) => (
          <DemoChoiceCell
            key={i}
            isCorrect={choice.isCorrect}
            className="flex-col gap-2"
          >
            <div className="scale-125">
              <Hai hai={choice.hai} />
            </div>
            {choice.isCorrect && (
              <span className="text-xs font-bold text-primary-600">
                {t("fu", { value: 2 })}
              </span>
            )}
          </DemoChoiceCell>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { DemoChoiceCell } from "../../_components/demo-choice-cell";
import { JantouFuKazeContext } from "./jantou-fu-kaze-context";
import { QuestionPrompt } from "../../_components/question-prompt";

/** デモ用の固定例: 東場・南家の4択 */
const DEMO_CHOICES: readonly HaiKindId[] = [
  HaiKind.PinZu5,
  HaiKind.Chun,
  HaiKind.Sha,
  HaiKind.SouZu3,
];

/**
 * 雀頭符練習の「問題方式」ビジュアルデモ
 * 雀頭符 遊び方デモ
 *
 * 実際の出題盤面（場風・自風の提示と4択）を、出題時（未回答）のまま
 * 静的に再現する。
 */
export function JantouFuHowToPlay() {
  const t = useTranslations("jantouFu");

  return (
    <div className="space-y-5">
      {/* Context */}
      <JantouFuKazeContext bakaze={HaiKind.Ton} jikaze={HaiKind.Nan} />

      {/* Question */}
      <QuestionPrompt>{t("selectCorrectHead")}</QuestionPrompt>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {DEMO_CHOICES.map((hai, i) => (
          <DemoChoiceCell key={i}>
            <div className="scale-125">
              <Hai hai={hai} />
            </div>
          </DemoChoiceCell>
        ))}
      </div>
    </div>
  );
}

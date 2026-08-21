"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { DemoFuChoiceGrid } from "../../_components/demo-fu-choice-grid";
import { PromptLabel } from "../../_components/prompt-label";
import { FU_OPTIONS } from "../../_lib/fu-options";
import { QuestionPrompt } from "../../_components/question-prompt";

/** デモ用の固定例: 中張牌（五筒）の暗刻 → 4符 */
const DEMO_MENTSU: readonly HaiKindId[] = [
  HaiKind.PinZu5,
  HaiKind.PinZu5,
  HaiKind.PinZu5,
];
const DEMO_ANSWER = 4;

/**
 * 面子符練習の「問題方式」ビジュアルデモ
 * 面子符 遊び方デモ
 *
 * 実際の出題盤面（面子の提示と符の選択）を静的に再現し、
 * 正解の符をハイライトしてプレイ方法を端的に示す。
 */
export function MentsuFuHowToPlay() {
  const t = useTranslations("mentsuFu");

  return (
    <div className="space-y-5">
      {/* Mentsu */}
      <div className="flex flex-col items-center gap-2">
        <PromptLabel>{t("mentsuLabel")}</PromptLabel>
        <div className="flex gap-0.5 scale-125 origin-center">
          {DEMO_MENTSU.map((hai, i) => (
            <Hai key={i} hai={hai} />
          ))}
        </div>
      </div>

      {/* Question */}
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Fu options */}
      <DemoFuChoiceGrid
        options={FU_OPTIONS}
        answer={DEMO_ANSWER}
        columnsClassName="grid-cols-3"
        translationNamespace="mentsuFu"
      />
    </div>
  );
}

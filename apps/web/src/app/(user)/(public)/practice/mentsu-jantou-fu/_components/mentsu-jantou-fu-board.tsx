"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { TehaiDisplay } from "../../_components/tehai-display";
import { findAgariHighlight } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";
import type { MentsuJantouFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";
import { FuItemRow } from "./fu-item-row";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useMentsuJantouFuBoard } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/use-mentsu-jantou-fu-board";

type MentsuJantouFuBoardProps =
  RecordingPracticeBoardProps<MentsuJantouFuQuestionResult>;

/**
 * 面子と雀頭の符の出題盤面（手牌の提示と要素ごとの入力・一括判定）
 *
 * 出題状態と回答ロジック（全行が埋まった時点で送る）は `useMentsuJantouFuBoard`
 * が持ち、チャレンジ・トレーニング両モードで共有する。
 */
export function MentsuJantouFuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: MentsuJantouFuBoardProps) {
  const t = useTranslations("mentsuJantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const { question, answers, isRevealed, handleSelect } =
    useMentsuJantouFuBoard({
      renfonpaiAs4Fu,
      showFeedback,
      onAnswer,
      onRecordResult,
      onPresentQuestion,
    });
  const [tileScale, setTileScale] = useState(1);

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="mentsuJantouFu"
      />
    );
  }

  const agariHighlight = findAgariHighlight(
    question.items,
    question.context.agariHai,
  );
  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        onScaleChange={setTileScale}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Item list */}
      <div className="space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            index={idx}
            item={item}
            answer={answers[idx]}
            showFeedback={showFeedback}
            isRevealed={isRevealed}
            isCountingDown={isCountingDown}
            highlightedTileIndex={
              agariHighlight?.itemId === item.id
                ? agariHighlight.tileIndex
                : undefined
            }
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>
    </div>
  );
}

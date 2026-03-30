"use client";

import { useState, useCallback, memo } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  SELECTABLE_YAKU,
  getKazeName,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useAutoScale } from "../../_hooks/use-auto-scale";
import { DrillShell } from "../../_components/drill-shell";

/**
 * 翻数グループの定義
 * 翻数グループ
 */
interface HanGroup {
  readonly key: string;
  readonly startIndex: number;
  readonly endIndex: number;
}

const HAN_GROUPS: readonly HanGroup[] = [
  { key: "1", startIndex: 0, endIndex: 12 },
  { key: "2", startIndex: 12, endIndex: 22 },
  { key: "3", startIndex: 22, endIndex: 25 },
  { key: "6", startIndex: 25, endIndex: 26 },
  { key: "yakuman", startIndex: 26, endIndex: 36 },
];

function generateQuestion(): YakuQuestion | undefined {
  for (let i = 0; i < 10; i++) {
    const q = generateYakuQuestion();
    if (q) return q;
  }
  return undefined;
}

interface YakuTehaiDisplayProps {
  readonly question: YakuQuestion;
}

/**
 * 役選択ドリル用の手牌表示
 * 手牌表示
 */
const YakuTehaiDisplay = memo(function YakuTehaiDisplay({ question }: YakuTehaiDisplayProps) {
  const t = useTranslations("yaku");
  const { wrapperRef, contentRef, scale } = useAutoScale([question]);

  return (
    <div className="mt-4 rounded-xl border border-surface-200 bg-white p-2 shadow-sm">
      <div
        ref={wrapperRef}
        className="relative overflow-hidden"
        style={{ height: `${45 * scale}px` }}
      >
        <div
          ref={contentRef}
          className="absolute left-0 top-0 flex items-end whitespace-nowrap"
          style={{ transformOrigin: "left top" }}
        >
          <div className="flex shrink-0">
            {question.tehai.closed.map((kindId, i) => (
              <Hai key={i} hai={kindId} size="sm" />
            ))}
          </div>
          {question.tehai.exposed.length > 0 && (
            <div className="flex shrink-0 ml-1">
              {question.tehai.exposed.map((mentsu, i) => (
                <Furo key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
        <div className="text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(question.context.bakaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(question.context.jikaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agari")}</span>
          <div
            className="mt-0.5 flex justify-center"
            style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
          >
            <Hai hai={question.context.agariHai} size="sm" />
          </div>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agariType")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {question.context.isTsumo ? t("tsumo") : t("ron")}
          </p>
        </div>
        {question.context.isRiichi && (
          <div className="text-center">
            <span className="text-surface-400">{t("riichi")}</span>
            <p className="mt-0.5 font-bold text-red-600">&#x25CF;</p>
          </div>
        )}
        {question.context.doraMarkers.length > 0 && (
          <div className="text-center">
            <span className="text-surface-400">{t("dora")}</span>
            <div
              className="mt-0.5 flex justify-center gap-0.5"
              style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
            >
              {question.context.doraMarkers.map((marker, i) => (
                <Hai key={i} hai={marker} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

interface YakuChipProps {
  readonly yakuName: string;
  readonly isSelected: boolean;
  readonly feedbackState: "correct" | "incorrect" | "missed" | undefined;
  readonly disabled: boolean;
  readonly onToggle: (yakuName: string) => void;
}

/**
 * 役選択チップ
 * 役チップ
 */
const YakuChip = memo(function YakuChip({
  yakuName,
  isSelected,
  feedbackState,
  disabled,
  onToggle,
}: YakuChipProps) {
  const handleClick = useCallback(() => {
    onToggle(yakuName);
  }, [yakuName, onToggle]);

  let chipClasses =
    "inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none";

  if (feedbackState === "correct") {
    chipClasses += " border-green-500 bg-green-50 text-green-700";
  } else if (feedbackState === "incorrect") {
    chipClasses += " border-red-500 bg-red-50 text-red-700";
  } else if (feedbackState === "missed") {
    chipClasses += " border-amber-500 bg-amber-50 text-amber-700";
  } else if (isSelected) {
    chipClasses += " border-primary-500 bg-primary-50 text-primary-700";
  } else {
    chipClasses += " border-surface-200 bg-white text-surface-600 hover:border-primary-300";
  }

  if (disabled && !feedbackState) {
    chipClasses += " opacity-50 pointer-events-none";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled && !feedbackState}
      className={chipClasses}
    >
      {yakuName}
    </button>
  );
});

/**
 * 各役のフィードバック状態を計算する
 * フィードバック状態計算
 */
function getChipFeedbackState(
  yakuName: string,
  selectedYaku: ReadonlySet<string>,
  correctYakuNames: readonly string[],
): "correct" | "incorrect" | "missed" | undefined {
  const isSelected = selectedYaku.has(yakuName);
  const isCorrect = correctYakuNames.includes(yakuName);

  if (isSelected && isCorrect) return "correct";
  if (isSelected && !isCorrect) return "incorrect";
  if (!isSelected && isCorrect) return "missed";
  return undefined;
}

export function YakuDrill() {
  const t = useTranslations("yaku");
  const [question, setQuestion] = useState<YakuQuestion | undefined>(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
  }, []);

  const handleToggleYaku = useCallback(
    (yakuName: string) => {
      if (showFeedback) return;
      setSelectedYaku((prev) => {
        const next = new Set(prev);
        if (next.has(yakuName)) {
          next.delete(yakuName);
        } else {
          next.add(yakuName);
        }
        return next;
      });
    },
    [showFeedback],
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback || selectedYaku.size === 0) return;
    const isCorrect = judgeYakuAnswer(
      question.correctYakuNames,
      [...selectedYaku],
    );
    handleAnswer(isCorrect, advanceQuestion);
  }, [question, selectedYaku, showFeedback, handleAnswer, advanceQuestion]);

  if (!question) return undefined;

  const hasSelection = selectedYaku.size > 0;

  return (
    <DrillShell
      gameSession={gameSession}
      timerControl={timerControl}
      resultPath="/practice/yaku/result"
      maxWidth="max-w-2xl"
    >
      <YakuTehaiDisplay question={question} />

      {/* Instruction */}
      <p className="mt-4 text-center text-sm font-medium text-surface-600">
        {t("selectYaku")}
      </p>

      {/* Yaku selection */}
      <div className="mt-3 space-y-3">
        {HAN_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-xs font-semibold text-surface-400">
              {t(`hanGroup.${group.key}`)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_YAKU.slice(group.startIndex, group.endIndex).map(
                (yakuName) => (
                  <YakuChip
                    key={yakuName}
                    yakuName={yakuName}
                    isSelected={selectedYaku.has(yakuName)}
                    feedbackState={
                      showFeedback
                        ? getChipFeedbackState(
                            yakuName,
                            selectedYaku,
                            question.correctYakuNames,
                          )
                        : undefined
                    }
                    disabled={showFeedback || isCountingDown}
                    onToggle={handleToggleYaku}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasSelection || showFeedback || isCountingDown}
          className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            hasSelection && !showFeedback && !isCountingDown
              ? "bg-primary-500 hover:bg-primary-600"
              : "cursor-not-allowed bg-surface-300"
          }`}
        >
          {t("checkButton")}
        </button>
      </div>
    </DrillShell>
  );
}

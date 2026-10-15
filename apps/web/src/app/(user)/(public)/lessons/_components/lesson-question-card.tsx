"use client";

import { useTranslations } from "next-intl";

import { LightbulbIcon } from "@/app/(user)/_components/icons/lightbulb-icon";
import { MentsuSet } from "@/app/(user)/_components/mentsu-set";
import { TileSet } from "@/app/(user)/_components/tile-set";
import { TehaiDisplay } from "@/app/(user)/(public)/practice/_components/tehai-display";
import { ChoiceButton } from "@/app/(user)/(public)/practice/_components/choice-button";
import { FeedbackFrame } from "@/app/(user)/(public)/practice/_components/feedback-frame";
import { JudgementMark } from "@/app/(user)/(public)/practice/_components/judgement-mark";
import { PromptLabel } from "@/app/(user)/(public)/practice/_components/prompt-label";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { getFeedbackStyles } from "@/app/(user)/(public)/practice/_lib/feedback-styles";
import {
  choiceKey,
  isSameChoice,
  type LessonChoice,
  type LessonPrompt,
  type LessonQuestion,
} from "@mahjong-scoring/features/lessons/quiz";
import {
  lessonAnswerLabel,
  lessonChoiceLabel,
  lessonConditionValues,
} from "@mahjong-scoring/features/lessons/quiz-labels";

/**
 * 選択肢の文字の大きさ
 *
 * 子のツモは数字が 2 つ並び（「8,000 / 16,000」）、スマホの 2 列では
 * 既定の大きさだと途中で折り返す。この種類だけ一段小さくし、折り返さない。
 */
function choiceTextClass(choice: LessonChoice): string {
  return choice.kind === "koTsumo"
    ? "whitespace-nowrap text-base font-bold tabular-nums"
    : "text-lg font-bold tabular-nums";
}

/**
 * 条件文の下に並べる牌
 * 出題牌
 *
 * 牌を見て答える問題（雀頭・面子 …）だけが持つ。文字だけで条件が言い切れる
 * 問題（帯・役）は undefined。
 */
function PromptTiles({ prompt }: { readonly prompt: LessonPrompt }) {
  switch (prompt.kind) {
    case "tier":
    case "yaku":
    case "agari":
    case "extraFu":
      return undefined;
    case "jantou":
      return (
        <div className="flex justify-center" data-testid="lesson-tiles">
          <TileSet tiles={[prompt.tile, prompt.tile]} size="md" />
        </div>
      );
    case "mentsu":
      return (
        <div className="flex justify-center" data-testid="lesson-tiles">
          <MentsuSet mentsu={prompt.mentsu} size="md" />
        </div>
      );
    case "machi":
      // 教本の待ちの例（手の内 ＋ 和了牌）と同じ並び
      return (
        <div
          className="flex items-center justify-center gap-2"
          data-testid="lesson-tiles"
        >
          <TileSet tiles={prompt.tiles} size="md" />
          <span className="text-sm text-surface-400">+</span>
          <TileSet tiles={[prompt.agariHai]} size="md" />
        </div>
      );
    case "tehai":
      // 手牌は 14 枚並び、枠の内側では読めない大きさまで縮む。枠の外の
      // 盤面（{@link PromptBoard}）に出す
      return undefined;
    default: {
      const exhaustive: never = prompt;
      return exhaustive;
    }
  }
}

/**
 * 条件の枠の上に置く手牌の盤面
 * 出題盤面
 *
 * 手牌 1 つを見て答える問題だけが持つ。練習・昇級試験と同じ盤面で、
 * スマホでは画面の左右いっぱいに広げて牌を大きく保つ（和了牌とツモ /
 * ロンは牌のそばに出る）。
 */
function PromptBoard({ prompt }: { readonly prompt: LessonPrompt }) {
  if (prompt.kind !== "tehai") return undefined;
  return (
    <div data-testid="lesson-tiles">
      <TehaiDisplay
        tehai={prompt.tehai}
        context={prompt.context}
        mobileFrame="fullBleed"
      />
    </div>
  );
}

interface LessonQuestionCardProps {
  /** 確認問題の辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  readonly question: LessonQuestion;
  readonly choices: readonly LessonChoice[];
  /** 選んだ選択肢。まだ選んでいなければ undefined */
  readonly selected: LessonChoice | undefined;
  /** ヒントを出すか（選ぶ前だけ出る） */
  readonly showHint: boolean;
  readonly onSelect: (choiceIndex: number) => void;
}

/**
 * 確認問題 1 問の盤面（条件 → 牌 → ヒント・正誤・解説 → 選択肢）
 * 確認問題カード
 *
 * レッスンの確認問題（`LessonView`）と、はじめ方ガイドから開く 1 問だけの
 * 体験ページで共有する。進行（何問目か・次へ・ヒントのボタン）は持たず、
 * 呼び出し側が置く。
 */
export function LessonQuestionCard({
  messageKey,
  question,
  choices,
  selected,
  showHint,
  onSelect,
}: LessonQuestionCardProps) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const tScoreTable = useTranslations("scoreTable");

  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && isSameChoice(selected, question.answer);

  return (
    <>
      <PromptBoard prompt={question.prompt} />

      <FeedbackFrame
        showFeedback={isAnswered}
        lastAnswerCorrect={isAnswered ? isCorrect : undefined}
        className="space-y-3 p-6 text-center"
      >
        <PromptLabel>{t("conditionLabel")}</PromptLabel>
        <p
          className="text-xl font-bold text-surface-900"
          data-testid="lesson-condition"
        >
          {tLesson(
            "condition",
            lessonConditionValues(question.prompt, tScoreTable),
          )}
        </p>
        <PromptTiles prompt={question.prompt} />
        {/* ヒントは選択肢に手を付ける前に見られる。答えそのものではなく
            倍率の言い方で、表を思い出す手がかりにする */}
        {showHint && !isAnswered && (
          <p
            className="flex items-start justify-center gap-1.5 text-sm text-muted-foreground"
            data-testid="lesson-hint"
          >
            {/* 見出しの「ヒント:」は電球で示し、読み上げにだけ残す。
                文字は控えめな灰で補足として引かせ、琥珀は電球だけに付ける
                （琥珀の濃い文字は警告の色 warning-strong と同じ値で注意書きに見える） */}
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600">
              <LightbulbIcon />
            </span>
            <span>
              <span className="sr-only">{t("hintLabel")}: </span>
              {tLesson(`questions.${question.key}.hint`)}
            </span>
          </p>
        )}
        {isAnswered && (
          <p
            className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isCorrect ? "text-success-strong" : "text-destructive-strong"}`}
            data-testid="lesson-judgement"
          >
            <JudgementMark
              verdict={isCorrect ? "correct" : "incorrect"}
              tone="inherit"
            />
            {isCorrect
              ? t("correct")
              : t("incorrect", {
                  answer: lessonAnswerLabel(question.answer, t),
                })}
          </p>
        )}
        {isAnswered && (
          <p className="text-sm leading-relaxed text-surface-700">
            {tLesson(`questions.${question.key}.explanation`)}
          </p>
        )}
      </FeedbackFrame>

      <QuestionPrompt>{tLesson("questionPrompt")}</QuestionPrompt>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {choices.map((choice, choiceIndex) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            isAnswered,
            selected !== undefined && isSameChoice(selected, choice),
            isSameChoice(choice, question.answer),
          );
          return (
            <ChoiceButton
              key={choiceKey(choice)}
              index={choiceIndex}
              onSelect={onSelect}
              disabled={isAnswered}
              borderClass={borderClass}
              bgClass={bgClass}
              className={choiceTextClass(choice)}
            >
              {lessonChoiceLabel(choice, t)}
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}

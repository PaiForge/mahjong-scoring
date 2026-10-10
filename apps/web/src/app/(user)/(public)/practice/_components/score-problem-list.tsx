"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import { QuestionDisplay } from "../agari-score/_components/question-display";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
import {
  restoreScoreQuestion,
  scoreResultSummary,
} from "@mahjong-scoring/features/results/score-question-result";
import { buildYakumanCapNote } from "@mahjong-scoring/features/results/yakuman-cap-note";
import { AnswerComparison } from "./answer-comparison";
import { ProblemListAccordion } from "./problem-list-accordion";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { ScoreBreakdownPanel } from "./score-breakdown-panel";

interface ScoreProblemListProps {
  readonly results: readonly ScoreQuestionResult[];
  /** i18n の翻訳ネームスペース（例: "scoreTableChallenge"） */
  readonly translationNamespace: string;
  /** 正解を表示する際のレンダリング関数。リンク付き表示などをカスタマイズできる */
  readonly renderCorrectAnswer: (
    answer: ScoreTableAnswer,
    result: ScoreQuestionResult,
  ) => ReactNode;
  /** ユーザー回答を表示する際のフォーマット関数 */
  readonly formatAnswer: (
    answer: ScoreTableAnswer,
    t: (key: string) => string,
  ) => string;
}

/**
 * 点数系練習共通の問題別フィードバック一覧
 * 点数問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 * 出題スナップショットが保存されている場合は、出題時と同じ手牌表示も再現する。
 *
 * 詳細は「手牌 → 面子分解 → 符・翻数の内訳（符と翻の根拠）→ 答え合わせ」の
 * 順に並べる。要約行は「子・ロン・40符・2翻」としか言わないので、
 * 間違えた人が数え直すには符と翻それぞれの根拠が要る。面子分解は牌の分け方まで
 * しか見せず、副底・門前加符・ツモ符・待ち符と 10 符単位の切り上げは符の内訳
 * （合計符練習の結果ページと同じ表）が受け持つ。符の内訳は満貫未満の問題だけが
 * 持つ（満貫以上は符が点数に効かず、要約行も符を省く）。翻数の内訳は翻数即答
 * 練習の結果ページと同じ表を使う。2 つは 1 つの入口から切り替える
 * （{@link ScoreBreakdownPanel}）。
 *
 * 内訳は既定で閉じている。ここで問われているのは点数であって符や翻ではなく、
 * 開いたままだと行数だけ答え合わせが下へ流れる。
 */
export function ScoreProblemList({
  results,
  translationNamespace,
  renderCorrectAnswer,
  formatAnswer,
}: ScoreProblemListProps) {
  const t = useTranslations(translationNamespace);
  // 役満止まりの注記は内訳表（challenge.yakuBreakdown）と同じ語彙で組む
  const tBreakdown = useTranslations("challenge.yakuBreakdown");
  const fuHanOrder = useFuHanOrder();

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace={translationNamespace}
      outcome={(r) => r.outcome}
      renderSummary={(result) => scoreResultSummary(result, t, fuHanOrder)}
      renderDetail={(result) => {
        const question = restoreScoreQuestion(result.question, result.isTsumo);

        return (
          <div className="space-y-3">
            {question && <QuestionDisplay question={question} />}
            {question && (
              <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
            )}
            {/* 符と翻数の内訳。符は満貫以上の問題に無く、どちらも保存を
                始める前の旧データには無い */}
            <ScoreBreakdownPanel
              fu={
                result.question?.fuDetails !== undefined &&
                result.fu !== undefined
                  ? { details: result.question.fuDetails, answer: result.fu }
                  : undefined
              }
              yakuDetails={result.question?.yakuDetails}
              yakuNote={buildYakumanCapNote(
                result.question?.yakuDetails,
                result.yakumanMultiplier,
                tBreakdown,
              )}
            />

            <AnswerComparison
              translationNamespace={translationNamespace}
              outcome={result.outcome}
              correct={renderCorrectAnswer(result.correctAnswer, result)}
              user={
                result.userAnswer === undefined
                  ? undefined
                  : formatAnswer(result.userAnswer, t)
              }
            />
          </div>
        );
      }}
    />
  );
}

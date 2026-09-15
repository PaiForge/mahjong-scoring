"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import { orderFuHan } from "@/app/_lib/fu-han-order";
import { QuestionDisplay } from "../score/_components/question-display";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { restoreScoreQuestion } from "../_lib/score-question-result";
import { buildYakumanCapNote } from "../_lib/yakuman-cap-note";
import { AnswerComparison } from "./answer-comparison";
import { ProblemListAccordion } from "./problem-list-accordion";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { YakuBreakdown } from "./yaku-breakdown";

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
 * 詳細は「手牌 → 面子の内訳（符の根拠）→ 翻数の内訳（翻の根拠）→ 答え合わせ」の
 * 順に並べる。要約行は「子・ロン・70符・6翻」としか言わないので、間違えた人が
 * 数え直すには符と翻それぞれの根拠が要る。翻数の内訳は翻数即答練習の結果ページと
 * 同じ表（{@link YakuBreakdown}）を使う。
 *
 * 翻数の内訳は既定で閉じている（{@link YakuBreakdown} が常に閉じて始まる）。
 * ここで問われているのは点数であって翻ではなく、開いたままだと役の行数だけ
 * 答え合わせが下へ流れる。
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
      renderSummary={(result) => {
        // 符と翻の順は表示設定に従う（出題文の ScoreTablePrompt と同じ）。
        // 満貫以上の問題は符を持たないため、orderFuHan が符を省く
        const summary = [
          result.isOya ? t("oya") : t("ko"),
          result.isTsumo ? t("tsumo") : t("ron"),
          ...orderFuHan(fuHanOrder, {
            fu:
              result.fu === undefined
                ? undefined
                : t("fu", { count: result.fu }),
            han: t("han", { count: result.han }),
          }),
        ].join("・");
        return summary;
      }}
      renderDetail={(result) => {
        const question = restoreScoreQuestion(result.question, result.isTsumo);

        return (
          <div className="space-y-3">
            {question && <QuestionDisplay question={question} />}
            {question && (
              <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
            )}
            {/* 役の内訳。保存を始める前の旧データには無いため任意 */}
            {result.question?.yakuDetails !== undefined && (
              <YakuBreakdown
                yakuDetails={result.question.yakuDetails}
                note={buildYakumanCapNote(
                  result.question.yakuDetails,
                  result.yakumanMultiplier,
                  tBreakdown,
                )}
              />
            )}

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

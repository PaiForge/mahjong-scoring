"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
import type { HaiKindId, ScoreTableAnswer } from "@mahjong-scoring/core";
import type { ScoreQuestionDisplayData } from "../score/_components/question-display";
import { QuestionDisplay } from "../score/_components/question-display";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { AnswerComparison } from "./answer-comparison";
import { ProblemListAccordion } from "./problem-list-accordion";

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
 * MSPZ 文字列のドラ表示牌リストを牌IDに復元する
 * ドラ表示牌復元
 */
function parseMarkers(
  markers: readonly string[] | undefined,
): readonly HaiKindId[] | undefined {
  return markers?.flatMap((marker) => parseHais(marker));
}

/**
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （正誤と回答の比較は出題スナップショットに依存しないため表示できる）。
 * スナップショットを保存する前の旧データも同様に undefined になる。
 */
function restoreQuestion(
  result: ScoreQuestionResult,
): ScoreQuestionDisplayData | undefined {
  const snapshot = result.question;
  if (!snapshot) return undefined;

  const tehai = parseTehai(snapshot.tehai);
  const agariHai = parseHais(snapshot.agariHai)[0];
  const bakaze = parseKazehai(snapshot.bakaze);
  const jikaze = parseKazehai(snapshot.jikaze);
  if (!tehai || agariHai === undefined || !bakaze || !jikaze) return undefined;

  return {
    tehai,
    agariHai,
    isTsumo: result.isTsumo,
    jikaze,
    bakaze,
    doraMarkers: parseMarkers(snapshot.doraMarkers) ?? [],
    isRiichi: snapshot.isRiichi,
    uraDoraMarkers: parseMarkers(snapshot.uraDoraMarkers),
  };
}

/**
 * 点数系練習共通の問題別フィードバック一覧
 * 点数問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 * 出題スナップショットが保存されている場合は、出題時と同じ手牌表示も再現する。
 */
export function ScoreProblemList({
  results,
  translationNamespace,
  renderCorrectAnswer,
  formatAnswer,
}: ScoreProblemListProps) {
  const t = useTranslations(translationNamespace);

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace={translationNamespace}
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => {
        // \u6E80\u8CAB\u4EE5\u4E0A\u306E\u554F\u984C\u306F\u7B26\u3092\u6301\u305F\u306A\u3044\u305F\u3081\u3001\u7B26\u306E\u8868\u793A\u3092\u7701\u304F\u3002
        const summary = [
          result.isOya ? t("oya") : t("ko"),
          result.isTsumo ? t("tsumo") : t("ron"),
          t("han", { count: result.han }),
          ...(result.fu === undefined ? [] : [t("fu", { count: result.fu })]),
        ].join("\u30FB");
        return summary;
      }}
      renderDetail={(result) => {
        const question = restoreQuestion(result);

        return (
          <div className="space-y-3">
            {question && <QuestionDisplay question={question} size="xs" />}

            <AnswerComparison
              translationNamespace={translationNamespace}
              isCorrect={result.isCorrect}
              correct={renderCorrectAnswer(result.correctAnswer, result)}
              user={formatAnswer(result.userAnswer, t)}
            />
          </div>
        );
      }}
    />
  );
}

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { QuestionDisplay } from "../score/_components/question-display";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { restoreScoreQuestion } from "../_lib/score-question-result";
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
 * 順に並べる。要約行は「子・ロン・6翻・70符」としか言わないので、間違えた人が
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
                note={buildCapNote(result, tBreakdown)}
              />
            )}

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

/**
 * 翻数の内訳の合計が支払いに反映されない分の注記を組み立てる
 * 役満止まり注記
 *
 * 役満手に役牌・リーチの翻が乗った手や、合算しない設定の複合役満では、
 * 内訳の合計（例: 26翻）が支払い（役満1つ分）を超える。内訳をそのまま
 * 信じて点数を引くと合わないため、「26翻 → 役満」の形で打ち止め先を示す。
 *
 * 打ち止め先は保存された役満単位（{@link ScoreQuestionResult.yakumanMultiplier}）
 * から導く。単位を保存する前の旧データでは判定できないため注記を出さない。
 */
function buildCapNote(
  result: ScoreQuestionResult,
  t: (key: string, values?: Record<string, number>) => string,
): ReactNode {
  const { yakumanMultiplier } = result;
  if (yakumanMultiplier === undefined) return undefined;

  const details = result.question?.yakuDetails;
  if (details === undefined) return undefined;
  const rawTotal = details.reduce((sum, detail) => sum + detail.han, 0);

  // 支払いに対応する翻数（役満13翻 × 単位。数え役満は役満1つ分）
  const capHan = YAKUMAN_HAN * Math.max(yakumanMultiplier, 1);
  if (rawTotal <= capHan || rawTotal < YAKUMAN_HAN) return undefined;

  const capLabel = yakumanMultiplier >= 2 ? t("doubleYakuman") : t("yakuman");
  const note = `${t("han", { count: rawTotal })} → ${capLabel}`;
  return yakumanMultiplier >= 2 ? note : `${note}（${t("cappedNote")}）`;
}

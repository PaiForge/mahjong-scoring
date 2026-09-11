"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type {
  JudgementResult,
  MachiCellAnswer,
  MachiScoreQuestion,
  MachiSelectionJudgement,
  ScoreQuestion,
} from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { Button } from "@/app/(user)/_components/button";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { ResultDisplay } from "../../score/_components/result-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { correctCellAnswerOf } from "../_lib/format-cell-answer";
import { MACHI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "../_hooks/use-machi-score-store";

interface MachiScoreResultProps {
  readonly question: MachiScoreQuestion;
  /** 待ち牌の判定。「わからない」で待ちを答える前に開示したときは undefined */
  readonly machiJudgement: MachiSelectionJudgement | undefined;
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  /** マスごとの判定。「わからない」での開示では undefined */
  readonly cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  readonly requireYaku: boolean;
  readonly simplifyMangan: boolean;
  readonly requireFuForMangan: boolean;
  readonly onNext: () => void;
  /** 「待ちごとの結果」の見出しの横に添える操作（ヘルプツアーの「?」） */
  readonly helpAction?: ReactNode;
}

/** マスの結果の配色。判定が無い（開示）ときは中立 */
function cellClasses(
  isFocused: boolean,
  result: JudgementResult | undefined,
): string {
  const tone =
    result === undefined
      ? "border-ink bg-white"
      : result.isCorrect
        ? "border-success bg-success-subtle"
        : "border-destructive bg-destructive-subtle";
  return isFocused ? `${tone} ring-2 ring-primary-500 ring-offset-2` : tone;
}

/**
 * 待ち別点数計算の答え合わせ
 * 待ち別結果表示
 *
 * 上に待ち牌の正誤、次に待ち × ツモ/ロン の一覧（正解と、外していれば
 * 自分の回答）、下に選んだマスの内訳（点数計算総合演習と同じ結果表 +
 * 面子分解）を出す。マスは多いと 6 つ以上あるため内訳は 1 つずつ見せる。
 */
export function MachiScoreResult({
  question,
  machiJudgement,
  cellAnswers,
  cellResults,
  formatAnswer,
  requireYaku,
  simplifyMangan,
  requireFuForMangan,
  onNext,
  helpAction,
}: MachiScoreResultProps) {
  const t = useTranslations("machiScore.result");
  const tCells = useTranslations("machiScore.cells");
  const tScore = useTranslations("score");
  const cells = listCellRefs(question);
  const [focused, setFocused] = useState<MachiCellRef>(cells[0]);

  const cellQuestionOf = (cell: MachiCellRef): ScoreQuestion | undefined => {
    const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
    return cell.isTsumo ? wait?.tsumo : wait?.ron;
  };

  const focusedKey = cellKeyOf(focused);
  const focusedQuestion = cellQuestionOf(focused);
  const focusedAnswer = cellAnswers[focusedKey];
  const focusedResult = cellResults?.[focusedKey];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 待ち牌の正誤。開示のときは正解の待ちだけを見せる */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-50 p-4">
        <span
          className={`text-sm font-bold ${
            machiJudgement === undefined
              ? "text-surface-700"
              : machiJudgement.isCorrect
                ? "text-success"
                : "text-destructive"
          }`}
        >
          {machiJudgement === undefined
            ? t("machiRevealed")
            : machiJudgement.isCorrect
              ? t("machiCorrect")
              : t("machiIncorrect")}
        </span>
        <span className="flex gap-1">
          {question.waits.map((wait) => (
            <Hai key={wait.agariHai} hai={wait.agariHai} size="sm" />
          ))}
        </span>
      </div>

      {/* 待ち × ツモ/ロン の一覧 */}
      <div
        className="space-y-2"
        data-tour-id={MACHI_SCORE_TOUR_ID.resultSummary}
      >
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-surface-700">
              {t("summaryTitle")}
            </h3>
            {helpAction}
          </span>
          <span className="text-xs text-surface-500">{t("detailHint")}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-14 px-1 pb-1 text-center text-sm font-bold text-surface-700"
                >
                  {tCells("wait")}
                </th>
                {[true, false].map((isTsumo) => (
                  <th
                    key={String(isTsumo)}
                    scope="col"
                    className="px-1 pb-1 text-center text-sm font-bold text-surface-700"
                  >
                    {tCells(isTsumo ? "tsumo" : "ron")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.waits.map((wait) => (
                <tr key={wait.agariHai}>
                  <th scope="row" className="p-1 text-center align-middle">
                    <span className="inline-flex justify-center">
                      <Hai hai={wait.agariHai} size="sm" />
                    </span>
                  </th>
                  {[true, false].map((isTsumo) => {
                    const cell = { agariHai: wait.agariHai, isTsumo };
                    const key = cellKeyOf(cell);
                    const result = cellResults?.[key];
                    const answer = cellAnswers[key];
                    const correct = correctCellAnswerOf(cellQuestionOf(cell));
                    return (
                      <td key={key} className="p-1 sm:p-1.5">
                        <button
                          type="button"
                          aria-pressed={key === focusedKey}
                          onClick={() => setFocused(cell)}
                          className={`flex min-h-14 w-full flex-col items-center justify-center rounded-lg border-3 px-2 py-2 text-center leading-snug ${cellClasses(key === focusedKey, result)}`}
                        >
                          <span className="text-sm font-bold text-surface-900">
                            {formatAnswer(correct, isTsumo)}
                            {result !== undefined &&
                              (result.isCorrect ? " ✓" : " ✗")}
                          </span>
                          {result !== undefined &&
                            !result.isCorrect &&
                            answer !== undefined && (
                              <span className="text-xs text-destructive line-through">
                                {formatAnswer(answer, isTsumo)}
                              </span>
                            )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 選んだマスの内訳 */}
      {focusedQuestion ? (
        <div
          className="space-y-4"
          data-tour-id={MACHI_SCORE_TOUR_ID.resultDetail}
        >
          <TehaiMentsuBreakdown
            tehai={focusedQuestion.tehai}
            context={focusedQuestion}
          />
          <ResultDisplay
            key={focusedKey}
            question={focusedQuestion}
            userAnswer={
              focusedAnswer?.kind === "score" ? focusedAnswer.answer : undefined
            }
            result={focusedAnswer?.kind === "score" ? focusedResult : undefined}
            requireYaku={requireYaku}
            simplifyMangan={simplifyMangan}
            requireFuForMangan={requireFuForMangan}
          />
          {/* 「役なし」と答えたマスは結果表に「あなたの回答」列が無いので、ここで示す */}
          {focusedAnswer?.kind === "noYaku" && (
            <p className="text-sm text-destructive">
              {t("yourAnswer")}: {t("noYakuAnswered")} {"✗"}
            </p>
          )}
        </div>
      ) : (
        <HighlightPanel>
          <p className="text-sm leading-relaxed text-surface-800">
            {t("noYakuDetail")}
          </p>
          {focusedAnswer !== undefined && focusedResult !== undefined && (
            <p
              className={`mt-2 text-sm font-bold ${
                focusedResult.isCorrect ? "text-success" : "text-destructive"
              }`}
            >
              {t("yourAnswer")}: {formatAnswer(focusedAnswer, focused.isTsumo)}{" "}
              {focusedResult.isCorrect ? "✓" : "✗"}
            </p>
          )}
        </HighlightPanel>
      )}

      <Button size="lg" fullWidth onClick={onNext}>
        {tScore("result.next")}
      </Button>
    </div>
  );
}

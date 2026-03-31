"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  DrillQuestion,
  UserAnswer,
  JudgementResult,
} from "@mahjong-scoring/core";
import { isMangan, getScoreLevelName } from "@mahjong-scoring/core";

interface ResultDisplayProps {
  readonly question: DrillQuestion;
  readonly userAnswer: UserAnswer;
  readonly result: JudgementResult;
  readonly onNext: () => void;
  readonly onExit?: () => void;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
}

/**
 * 回答結果表示コンポーネント
 * 結果表示
 */
export function ResultDisplay({
  question,
  userAnswer,
  result,
  onNext,
  onExit,
  requireYaku = false,
  simplifyMangan = false,
  requireFuForMangan = false,
}: ResultDisplayProps) {
  const t = useTranslations("score");
  const { answer } = question;
  const isManganOrAbove = isMangan(answer.scoreLevel);
  const scoreLevelName = getScoreLevelName(answer.scoreLevel);
  const [showFuDetails, setShowFuDetails] = useState(false);
  const [showYakuDetails, setShowYakuDetails] = useState(false);

  const getPaymentDescription = () => {
    const { payment } = answer;
    if (payment.type === "ron") {
      return `${payment.amount}${t("form.labels.score")}`;
    }
    if (payment.type === "koTsumo") {
      return `${payment.amount[0]}/${payment.amount[1]}`;
    }
    if (payment.type === "oyaTsumo") {
      return `${payment.amount}${t("form.options.all")}`;
    }
    return "";
  };

  const getHanDisplay = (hanValue: number, levelName?: string) => {
    if (simplifyMangan && hanValue >= 5) {
      if (levelName) return levelName;
      if (hanValue >= 13) return t("form.options.yakuman");
      if (hanValue >= 11) return t("form.options.sanbaiman");
      if (hanValue >= 8) return t("form.options.baiman");
      if (hanValue >= 6) return t("form.options.haneman");
      if (hanValue >= 5) return t("form.options.mangan");
    }
    return `${hanValue}${t("form.options.hanSuffix")}`;
  };

  return (
    <div className="space-y-4">
      {/* Correct/Incorrect banner */}
      <div
        className={`rounded-lg py-3 text-center ${
          result.isCorrect
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        <div className="text-base font-bold">
          {result.isCorrect
            ? t("result.title.correct")
            : t("result.title.incorrect")}
        </div>
      </div>

      {/* Detail table */}
      <div className="rounded-lg bg-surface-50 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="pb-3 pr-4 pt-2 text-left font-bold text-surface-600" />
              <th className="pb-3 pr-4 pt-2 text-left font-bold text-surface-600">
                {t("result.headers.answer")}
              </th>
              <th className="pb-3 pt-2 text-left font-bold text-surface-600">
                {t("result.headers.correct")}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Yaku */}
            {requireYaku && (
              <tr>
                <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
                  {t("form.labels.yaku")}
                </td>
                <td className="py-2 pr-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {userAnswer.yakus.length > 0 ? (
                      userAnswer.yakus.map((yaku, idx) => (
                        <span
                          key={idx}
                          className={`inline-block rounded border px-2 py-0.5 text-xs ${
                            result.isYakuCorrect
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {yaku}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-surface-400">
                        {t("result.details.none")}
                      </span>
                    )}
                    <span
                      className={`ml-1 ${result.isYakuCorrect ? "text-green-600" : "text-red-600"}`}
                    >
                      {result.isYakuCorrect ? "\u2713" : "\u2717"}
                    </span>
                  </div>
                </td>
                <td className="py-2 align-top font-bold text-surface-800" />
              </tr>
            )}

            {/* Han */}
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                {t("form.labels.han")}
              </td>
              <td
                className={`py-2 pr-4 ${result.isHanCorrect ? "text-green-600" : "text-red-600"}`}
              >
                {getHanDisplay(userAnswer.han)}{" "}
                {result.isHanCorrect ? "\u2713" : "\u2717"}
              </td>
              <td className="py-2 font-bold text-surface-800">
                {getHanDisplay(answer.han)}
                {!simplifyMangan && scoreLevelName && ` (${scoreLevelName})`}
                {question.yakuDetails && question.yakuDetails.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowYakuDetails(!showYakuDetails)}
                    className="ml-2 text-xs font-normal text-primary-600 hover:text-primary-800 focus:outline-none"
                  >
                    {showYakuDetails ? "\u25B2" : "\u25BC"}
                  </button>
                )}
              </td>
            </tr>
            {showYakuDetails && question.yakuDetails && (
              <tr>
                <td colSpan={3} className="py-2">
                  <div className="rounded bg-white px-2 py-0 text-xs text-surface-600">
                    <div>
                      {question.yakuDetails.map((detail, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between border-b border-surface-100 py-1.5 last:border-0"
                        >
                          <span>{detail.name}</span>
                          <span>
                            {detail.han}
                            {t("form.options.hanSuffix")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-0 flex justify-between border-t border-surface-200 pb-1.5 pt-1.5 font-bold">
                      <span>{t("result.details.total")}</span>
                      <span>
                        {question.yakuDetails.reduce(
                          (acc, curr) => acc + curr.han,
                          0,
                        )}
                        {t("form.options.hanSuffix")}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Fu */}
            {(!isManganOrAbove || requireFuForMangan) && (
              <>
                <tr>
                  <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                    {t("form.labels.fu")}
                  </td>
                  <td
                    className={`py-2 pr-4 ${result.isFuCorrect ? "text-green-600" : "text-red-600"}`}
                  >
                    {userAnswer.fu ?? "-"}
                    {t("form.options.fuSuffix")}{" "}
                    {result.isFuCorrect ? "\u2713" : "\u2717"}
                  </td>
                  <td className="py-2 font-bold text-surface-800">
                    {answer.fu}
                    {t("form.options.fuSuffix")}
                    {question.fuDetails && (
                      <button
                        type="button"
                        onClick={() => setShowFuDetails(!showFuDetails)}
                        className="ml-2 text-xs font-normal text-primary-600 hover:text-primary-800 focus:outline-none"
                      >
                        {showFuDetails ? "\u25B2" : "\u25BC"}
                      </button>
                    )}
                  </td>
                </tr>
                {showFuDetails && question.fuDetails && (
                  <tr>
                    <td colSpan={3} className="py-2">
                      <div className="rounded bg-white px-2 py-0 text-xs text-surface-600">
                        <div>
                          {question.fuDetails.map((detail, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between border-b border-surface-100 py-1.5 last:border-0"
                            >
                              <span>{detail.reason}</span>
                              <span>
                                {detail.fu}
                                {t("form.options.fuSuffix")}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-0 flex justify-between border-t border-surface-200 pb-1.5 pt-1.5 font-bold">
                          <span>{t("result.details.total")}</span>
                          <span>
                            {question.fuDetails.reduce(
                              (acc, curr) => acc + curr.fu,
                              0,
                            )}
                            {t("form.options.fuSuffix")}
                          </span>
                        </div>
                        {question.fuDetails.reduce(
                          (acc, curr) => acc + curr.fu,
                          0,
                        ) !== answer.fu && (
                          <div className="mt-1 text-right text-[10px] text-surface-400">
                            {question.fuDetails.reduce(
                              (acc, curr) => acc + curr.fu,
                              0,
                            )}
                            {t("form.options.fuSuffix")} → {answer.fu}
                            {t("form.options.fuSuffix")} (
                            {t("result.details.roundUp")})
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}

            {/* Score */}
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                {t("form.labels.score")}
              </td>
              <td
                className={`py-2 pr-4 ${result.isScoreCorrect ? "text-green-600" : "text-red-600"}`}
              >
                {userAnswer.scoreFromKo !== undefined
                  ? `${userAnswer.scoreFromKo}/${userAnswer.scoreFromOya}`
                  : `${userAnswer.score}${t("result.pointSuffix")}`}{" "}
                {result.isScoreCorrect ? "\u2713" : "\u2717"}
              </td>
              <td className="py-2 font-bold text-surface-800">
                {getPaymentDescription()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-primary-500 py-3 px-6 font-bold text-white transition-colors hover:bg-primary-600"
      >
        {t("result.next")}
      </button>

      {/* Exit */}
      {onExit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-surface-500 underline hover:text-surface-600"
          >
            {t("form.buttons.exit")}
          </button>
        </div>
      )}
    </div>
  );
}

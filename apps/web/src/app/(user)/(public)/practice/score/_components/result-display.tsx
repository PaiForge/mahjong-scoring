"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
} from "@mahjong-scoring/core";
import { isMangan, getScoreLevelName } from "@mahjong-scoring/core";
import { practiceHanTier } from "../_lib/han-tiers";
import { formatScoreAnswer } from "../../_lib/format-score-answer";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { DetailsPanelRow, DetailsToggleButton } from "./details-accordion";
import type { DetailItem } from "./details-accordion";
import { Button } from "@/app/(user)/_components/button";

/** 結果テーブルの列数（項目名 / あなたの回答 / 正解）。展開行の colSpan に使う */
const TABLE_COLUMN_COUNT = 3;

interface ResultDisplayProps {
  readonly question: ScoreQuestion;
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
  const fuDetailsPanelId = useId();
  const yakuDetailsPanelId = useId();

  const fuTotal =
    question.fuDetails?.reduce((acc, curr) => acc + curr.fu, 0) ?? 0;
  const yakuTotal =
    question.yakuDetails?.reduce((acc, curr) => acc + curr.han, 0) ?? 0;

  const yakuDetailItems: readonly DetailItem[] =
    question.yakuDetails?.map((d) => ({ name: d.name, value: d.han })) ?? [];
  const fuDetailItems: readonly DetailItem[] =
    question.fuDetails?.map((d) => ({ name: d.reason, value: d.fu })) ?? [];

  // 正解の支払いは共通の整形関数に寄せる（"オール" 等の表記を1箇所で管理）。
  // ロンにはユーザー回答セルと同じ「点」を付ける。
  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  const getHanDisplay = (hanValue: number, levelName?: string) => {
    const tier = simplifyMangan ? practiceHanTier(hanValue) : undefined;
    if (tier) {
      return levelName ?? t(`form.options.${tier.key}`);
    }
    return `${hanValue}${t("form.options.hanSuffix")}`;
  };

  return (
    <div className="space-y-4">
      {/* Correct/Incorrect banner */}
      <div
        className={`rounded-lg py-3 text-center ${
          result.isCorrect
            ? "bg-success-subtle text-success-strong"
            : "bg-destructive-subtle text-destructive-strong"
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
            <tr className="border-b-3 border-ink">
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
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs ${
                            result.isYakuCorrect
                              ? "border-primary-200 bg-primary-50 text-primary-700"
                              : "border-destructive-subtle bg-destructive-subtle text-destructive-strong"
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
                      className={`ml-1 ${result.isYakuCorrect ? "text-success" : "text-destructive"}`}
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
                className={`py-2 pr-4 ${result.isHanCorrect ? "text-success" : "text-destructive"}`}
              >
                {getHanDisplay(userAnswer.han)}{" "}
                {result.isHanCorrect ? "\u2713" : "\u2717"}
              </td>
              <td className="py-2 font-bold text-surface-800">
                {getHanDisplay(answer.han)}
                {!simplifyMangan && scoreLevelName && ` (${scoreLevelName})`}
                {yakuDetailItems.length > 0 && (
                  <DetailsToggleButton
                    isOpen={showYakuDetails}
                    onToggle={() => setShowYakuDetails(!showYakuDetails)}
                    panelId={yakuDetailsPanelId}
                  />
                )}
              </td>
            </tr>
            {yakuDetailItems.length > 0 && showYakuDetails && (
              <DetailsPanelRow
                items={yakuDetailItems}
                total={yakuTotal}
                suffix={t("form.options.hanSuffix")}
                panelId={yakuDetailsPanelId}
                colSpan={TABLE_COLUMN_COUNT}
              />
            )}

            {/* Fu */}
            {(!isManganOrAbove || requireFuForMangan) && (
              <>
                <tr>
                  <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                    {t("form.labels.fu")}
                  </td>
                  <td
                    className={`py-2 pr-4 ${result.isFuCorrect ? "text-success" : "text-destructive"}`}
                  >
                    {userAnswer.fu ?? "-"}
                    {t("form.options.fuSuffix")}{" "}
                    {result.isFuCorrect ? "\u2713" : "\u2717"}
                  </td>
                  <td className="py-2 font-bold text-surface-800">
                    {answer.fu}
                    {t("form.options.fuSuffix")}
                    {question.fuDetails && (
                      <DetailsToggleButton
                        isOpen={showFuDetails}
                        onToggle={() => setShowFuDetails(!showFuDetails)}
                        panelId={fuDetailsPanelId}
                      />
                    )}
                  </td>
                </tr>
                {question.fuDetails && showFuDetails && (
                  <DetailsPanelRow
                    items={fuDetailItems}
                    total={fuTotal}
                    suffix={t("form.options.fuSuffix")}
                    panelId={fuDetailsPanelId}
                    colSpan={TABLE_COLUMN_COUNT}
                    roundedTotal={answer.fu}
                    roundUpLabel={t("result.details.roundUp")}
                  />
                )}
              </>
            )}

            {/* Score */}
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                {t("form.labels.score")}
              </td>
              <td
                className={`py-2 pr-4 ${result.isScoreCorrect ? "text-success" : "text-destructive"}`}
              >
                {userAnswer.scoreFromKo !== undefined
                  ? `${userAnswer.scoreFromKo}/${userAnswer.scoreFromOya}`
                  : `${userAnswer.score}${t("result.pointSuffix")}`}{" "}
                {result.isScoreCorrect ? "\u2713" : "\u2717"}
              </td>
              <td className="py-2 font-bold text-surface-800">
                {paymentDescription}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Next button */}
      <Button size="lg" fullWidth onClick={onNext}>
        {t("result.next")}
      </Button>

      {/* Exit */}
      {onExit && (
        <div className="text-center">
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

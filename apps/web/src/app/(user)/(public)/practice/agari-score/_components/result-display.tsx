"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
} from "@mahjong-scoring/core";
import {
  allowsDoubleYakuman,
  isMangan,
  isOya,
  getScoreLevelName,
} from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import {
  formatHan,
  formatPayment,
} from "@mahjong-scoring/features/practice/score/format-answer";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { buildScoreResultDisplay } from "@mahjong-scoring/features/results/score-result-display";
import { DetailsPanelRow } from "./details-accordion";
import { ScoreTableModal } from "./score-table-modal";
import { ReferenceLinkButton } from "../../_components/reference-link-button";
import {
  RESULT_TABLE_COLUMN_COUNT,
  ResultTableFrame,
  ResultUnansweredCell,
} from "./result-table-frame";
import { JudgementMark } from "../../_components/judgement-mark";
import { YakuCheatsheetModal } from "./yaku-cheatsheet-modal";
import { YakuJudgementChips } from "./yaku-judgement-chips";
import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";

interface ResultDisplayProps {
  readonly question: ScoreQuestion;
  /** ユーザーの回答。無回答の正解開示（「わからない」）では undefined */
  readonly userAnswer?: UserAnswer;
  /** 判定結果。無回答の正解開示（「わからない」）では undefined */
  readonly result?: JudgementResult;
  /**
   * 翻・符・点数の形を取らない回答の一言（聴牌形の点数計算の「役なし」）。
   * `userAnswer` の代わりに「あなたの回答」列の翻数の行へ ✗ 付きで出す
   * （役なしは翻数が無いという主張なので、その行に置く）。他の行は未回答
   */
  readonly answerSummary?: string;
  readonly requireYaku?: boolean;
  readonly exactHan?: boolean;
  readonly requireFuForMangan?: boolean;
}

/**
 * 回答結果表示コンポーネント
 * 結果表示
 *
 * `userAnswer` / `result` が無い場合は無回答の正解開示として描画する。
 * 「あなたの回答」列は落とさず各行に未回答の印を出す — 列数を変えると
 * 正解の列が中央へ動き、回答したときと開示したときで同じ値を別の場所に
 * 探すことになる。
 */
export function ResultDisplay({
  question,
  userAnswer,
  result,
  answerSummary,
  requireYaku = false,
  exactHan = false,
  requireFuForMangan = false,
}: ResultDisplayProps) {
  const t = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const yakuOrder = useYakuOrder();
  const { answer } = question;
  // ダブル役満採用時は 26 翻を役満へ丸めず「ダブル役満」と表示する
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const isManganOrAbove = isMangan(answer.scoreLevel);
  const scoreLevelName = getScoreLevelName(answer.scoreLevel);
  // 役一覧モーダル。役をタップしたときはその役へ着地させる（一覧全体を見たい
  // ときは undefined のまま開く）。
  const [yakuListFocus, setYakuListFocus] = useState<string | undefined>(
    undefined,
  );
  const [isYakuListOpen, setIsYakuListOpen] = useState(false);
  // 点数表モーダル。点数そのものをタップしたときだけ正解のセルを
  // ハイライトする（表への補助リンクからは素の表を開く）。
  const [isScoreTableOpen, setIsScoreTableOpen] = useState(false);
  const [isScoreTableHighlighted, setIsScoreTableHighlighted] = useState(false);

  const openYakuList = (yakuName?: string) => {
    setYakuListFocus(yakuName);
    setIsYakuListOpen(true);
  };

  const openScoreTable = (highlighted: boolean) => {
    setIsScoreTableHighlighted(highlighted);
    setIsScoreTableOpen(true);
  };

  // 判定付きの回答。無回答の開示では両方無い
  const judged =
    userAnswer !== undefined && result !== undefined
      ? { answer: userAnswer, result }
      : undefined;

  // 役の振り分けと内訳の並び・合計はモバイルと共有する
  const {
    answeredYakuJudgements,
    correctYakuJudgements,
    yakuBreakdown,
    fuBreakdown,
  } = buildScoreResultDisplay(question, userAnswer?.yakus, yakuOrder);
  const correctYakuNames = correctYakuJudgements.map(
    (judgement) => judgement.name,
  );

  // 正解の支払いは共通の整形関数に寄せる（"オール" 等の表記を1箇所で管理）。
  // ロンにはユーザー回答セルと同じ「点」を付ける。
  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  // 点数表モーダルに渡す「正解の位置」。満貫以上（5翻〜）では符は
  // 使われず、区分行のハイライトに解決される（resolveScoreTableFocus）。
  const scoreTableFocus: ScoreTableFocus = {
    role: isOya(question.jikaze) ? "oya" : "ko",
    winType: question.isTsumo ? "tsumo" : "ron",
    han: answer.han,
    fu: answer.fu,
  };

  const getHanDisplay = (hanValue: number) =>
    formatHan(hanValue, { t, exactHan, allowDoubleYakuman });

  return (
    <div className="space-y-4">
      {/* 表の箱・見出し・列幅の約束は ResultTableFrame（役なしのマスの表と共有） */}
      <ResultTableFrame>
        {/* Yaku */}
        {requireYaku && (
          <tbody>
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
                {t("form.labels.yaku")}
              </td>
              {judged ? (
                <td className="py-2 pr-4 text-right align-top">
                  <YakuJudgementChips
                    judgements={answeredYakuJudgements}
                    align="end"
                    emptyLabel={t("result.details.none")}
                    onSelect={openYakuList}
                  />
                </td>
              ) : (
                <ResultUnansweredCell />
              )}
              <td className="space-y-1.5 py-2 text-right align-top">
                <YakuJudgementChips
                  judgements={correctYakuJudgements}
                  align="end"
                  emptyLabel={t("result.details.none")}
                  onSelect={openYakuList}
                />
                {/* 役をタップしても開けるが、それが分かるように一覧への導線も置く */}
                <ReferenceLinkButton
                  icon={<BookIcon className="size-3.5 shrink-0" />}
                  label={t("result.viewYakuList")}
                  onClick={() => openYakuList()}
                />
              </td>
            </tr>
          </tbody>
        )}

        {/* Han */}
        <tbody>
          <tr>
            <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
              {t("form.labels.han")}
            </td>
            {judged ? (
              <td
                className={`py-2 pr-4 text-right ${judged.result.isHanCorrect ? "text-success" : "text-destructive"}`}
              >
                {getHanDisplay(judged.answer.han)}{" "}
                <JudgementMark
                  verdict={judged.result.isHanCorrect ? "correct" : "incorrect"}
                  label={tCommon(
                    judged.result.isHanCorrect ? "correct" : "incorrect",
                  )}
                />
              </td>
            ) : answerSummary !== undefined ? (
              <td className="py-2 pr-4 text-right text-destructive">
                {answerSummary}{" "}
                <JudgementMark
                  verdict="incorrect"
                  label={tCommon("incorrect")}
                />
              </td>
            ) : (
              <ResultUnansweredCell />
            )}
            <td className="py-2 text-right font-bold text-surface-800">
              {getHanDisplay(answer.han)}
              {exactHan && scoreLevelName && ` (${scoreLevelName})`}
            </td>
          </tr>
          {/* 翻数の内訳。閉じた状態から始める（理由は CollapsibleDetail） */}
          {yakuBreakdown && (
            <DetailsPanelRow
              title={t("result.details.yakuTitle")}
              items={yakuBreakdown.items}
              total={yakuBreakdown.total}
              suffix={t("form.options.hanSuffix")}
              colSpan={RESULT_TABLE_COLUMN_COUNT}
            />
          )}
        </tbody>

        {/* Fu */}
        {(!isManganOrAbove || requireFuForMangan) && (
          <tbody>
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
                {t("form.labels.fu")}
              </td>
              {judged ? (
                <td
                  className={`py-2 pr-4 text-right ${judged.result.isFuCorrect ? "text-success" : "text-destructive"}`}
                >
                  {judged.answer.fu ?? "-"}
                  {t("form.options.fuSuffix")}{" "}
                  <JudgementMark
                    verdict={
                      judged.result.isFuCorrect ? "correct" : "incorrect"
                    }
                    label={tCommon(
                      judged.result.isFuCorrect ? "correct" : "incorrect",
                    )}
                  />
                </td>
              ) : (
                <ResultUnansweredCell />
              )}
              <td className="py-2 text-right font-bold text-surface-800">
                {answer.fu}
                {t("form.options.fuSuffix")}
              </td>
            </tr>
            {fuBreakdown && (
              <DetailsPanelRow
                title={t("result.details.fuTitle")}
                items={fuBreakdown.items}
                total={fuBreakdown.total}
                suffix={t("form.options.fuSuffix")}
                colSpan={RESULT_TABLE_COLUMN_COUNT}
                roundedTotal={answer.fu}
                roundUpLabel={t("result.details.roundUp")}
              />
            )}
          </tbody>
        )}

        {/* Score */}
        <tbody>
          <tr>
            <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
              {t("form.labels.score")}
            </td>
            {judged ? (
              <td
                className={`py-2 pr-4 text-right align-top ${judged.result.isScoreCorrect ? "text-success" : "text-destructive"}`}
              >
                {formatPayment(judged.answer, false, { t })}{" "}
                <JudgementMark
                  verdict={
                    judged.result.isScoreCorrect ? "correct" : "incorrect"
                  }
                  label={tCommon(
                    judged.result.isScoreCorrect ? "correct" : "incorrect",
                  )}
                />
              </td>
            ) : (
              <ResultUnansweredCell />
            )}
            <td className="space-y-1.5 py-2 text-right align-top">
              {/* 押せることが見て分かるよう、常時点線の下線を敷く */}
              <button
                type="button"
                onClick={() => openScoreTable(true)}
                title={t("result.openInScoreTable")}
                className="ml-auto block cursor-pointer text-right font-bold text-surface-800 underline decoration-surface-400 decoration-dotted decoration-2 underline-offset-4 hover:decoration-action"
              >
                {paymentDescription}
              </button>
              {/* 点数をタップしても開けるが、それが分かるように表への導線も置く */}
              <ReferenceLinkButton
                icon={<TableIcon className="size-3.5 shrink-0" />}
                label={t("result.viewScoreTable")}
                onClick={() => openScoreTable(false)}
              />
            </td>
          </tr>
        </tbody>
      </ResultTableFrame>

      <ScoreTableModal
        isOpen={isScoreTableOpen}
        onClose={() => setIsScoreTableOpen(false)}
        focus={scoreTableFocus}
        highlighted={isScoreTableHighlighted}
      />

      <YakuCheatsheetModal
        isOpen={isYakuListOpen}
        onClose={() => setIsYakuListOpen(false)}
        markedYakuNames={correctYakuNames}
        focusedYakuName={yakuListFocus}
      />
    </div>
  );
}

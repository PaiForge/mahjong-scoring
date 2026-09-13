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
  judgeYakuSelection,
} from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { practiceHanTier } from "../_lib/han-tiers";
import { formatScoreAnswer } from "../../_lib/format-score-answer";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { DetailsPanelRow } from "./details-accordion";
import type { DetailItem } from "./details-accordion";
import { ScoreTableModal } from "./score-table-modal";
import { ReferenceLinkButton } from "../../_components/reference-link-button";
import { JudgementMark } from "../../_components/judgement-mark";
import { YakuCheatsheetModal } from "./yaku-cheatsheet-modal";
import { YakuJudgementChips } from "./yaku-judgement-chips";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";

/** 結果テーブルの列数（項目名 / あなたの回答 / 正解）。展開行の colSpan に使う */
const TABLE_COLUMN_COUNT = 3;

interface ResultDisplayProps {
  readonly question: ScoreQuestion;
  /** ユーザーの回答。無回答の正解開示（「わからない」）では undefined */
  readonly userAnswer?: UserAnswer;
  /** 判定結果。無回答の正解開示（「わからない」）では undefined */
  readonly result?: JudgementResult;
  /**
   * 翻・符・点数の形を取らない回答の一言（待ち別点数計算の「役なし」）。
   * `userAnswer` の代わりに「あなたの回答」列の翻数の行へ ✗ 付きで出す
   * （役なしは翻数が無いという主張なので、その行に置く）。他の行は未回答
   */
  readonly answerSummary?: string;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
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
  simplifyMangan = false,
  requireFuForMangan = false,
}: ResultDisplayProps) {
  const t = useTranslations("score");
  const tCommon = useTranslations("common");
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
  // 「あなたの回答」の未回答セル（開示のときの各行）
  const unansweredCell = (
    <td className="py-2 pr-4 text-right align-top text-surface-400">
      {t("result.unanswered")}
    </td>
  );

  const fuTotal =
    question.fuDetails?.reduce((acc, curr) => acc + curr.fu, 0) ?? 0;
  const yakuTotal =
    question.yakuDetails?.reduce((acc, curr) => acc + curr.han, 0) ?? 0;

  // 役は「合っていた / 余分だった / 選び忘れた」を役ごとに見せる。1つ余分なだけで
  // 回答全体が赤くなると、合っていた役まで間違いに見えてしまうため。
  const yakuJudgements = judgeYakuSelection(question, userAnswer?.yakus ?? []);
  const answeredYakuJudgements = yakuJudgements.filter(
    (judgement) => judgement.state !== "missed",
  );
  const correctYakuJudgements = yakuJudgements.filter(
    (judgement) => judgement.state !== "incorrect",
  );
  const correctYakuNames = correctYakuJudgements.map(
    (judgement) => judgement.name,
  );

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

  // 点数表モーダルに渡す「正解の位置」。満貫以上（5翻〜）では符は
  // 使われず、区分行のハイライトに解決される（resolveScoreTableFocus）。
  const scoreTableFocus: ScoreTableFocus = {
    role: isOya(question.jikaze) ? "oya" : "ko",
    winType: question.isTsumo ? "tsumo" : "ron",
    han: answer.han,
    fu: answer.fu,
  };

  const getHanDisplay = (hanValue: number, levelName?: string) => {
    const tier = simplifyMangan
      ? practiceHanTier(hanValue, allowDoubleYakuman)
      : undefined;
    if (tier) {
      return levelName ?? t(`form.options.${tier.key}`);
    }
    return `${hanValue}${t("form.options.hanSuffix")}`;
  };

  return (
    <div className="space-y-4">
      {/* Detail table
          回答全体の正誤を名乗る見出し・バナーは置かない。「あなたの回答」と
          「正解」を並べた時点で合っていたかは読めば分かり、行ごとの ✓/✗ と
          下部の正解/不正解カウンタが既に判定を持っている。全幅の色帯や
          見出し行を足すと、いちばん読ませたいこの表より判定が強く出る。

          値の 2 列は右端で揃える（項目名は左）。内訳の行は全幅で
          DetailTable が値を右端に置くので、正解の「2翻」の真下に内訳の
          「1翻 / 1翻 / 合計 2翻」が並び、縦に足し算が読める。左寄せだと
          正解は列の中ほど、内訳の合計は右端と、同じ数字が別の縦位置に出る

          罫線は項目（役・翻数・符・点数）の境目にだけ引く。項目ごとに
          `<tbody>` を分け、tbody 同士の境目を実線にする。翻数とその内訳の
          行は同じ tbody に入るので、開いた内訳がどの行に付く注釈かを線が
          言う。行ごとに引くと内訳の行の上下にも線が入り、内訳が独立した
          項目に見える。縦の罫線は引かない — 内訳の行は全幅（colSpan）
          なので開くたびに縦線が途切れて壊れて見えるし、アプリの表
          （DataTable / DetailTable）はどれも縦線を持たない。回答と正解は
          色（正誤の色 / 太字）で既に分かれている */}
      <div className="rounded-lg bg-surface-50 p-4">
        <table className="w-full text-sm [&>tbody+tbody]:border-t-2 [&>tbody+tbody]:border-surface-200">
          <thead>
            <tr className="border-b-3 border-ink">
              <th className="pb-3 pr-4 pt-2 text-left font-bold text-surface-600" />
              {/* 見出しは折り返さない。役のチップが列幅を取ると
                  「あなたの回答」が 2 行に割れて表の頭が崩れる */}
              <th className="whitespace-nowrap pb-3 pr-4 pt-2 text-right font-bold text-surface-600">
                {t("result.headers.answer")}
              </th>
              <th className="whitespace-nowrap pb-3 pt-2 text-right font-bold text-surface-600">
                {t("result.headers.correct")}
              </th>
            </tr>
          </thead>
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
                  unansweredCell
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
                    verdict={
                      judged.result.isHanCorrect ? "correct" : "incorrect"
                    }
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
                unansweredCell
              )}
              <td className="py-2 text-right font-bold text-surface-800">
                {getHanDisplay(answer.han)}
                {!simplifyMangan && scoreLevelName && ` (${scoreLevelName})`}
              </td>
            </tr>
            {/* 翻数の内訳。閉じた状態から始める（理由は CollapsibleDetail） */}
            {yakuDetailItems.length > 0 && (
              <DetailsPanelRow
                title={t("result.details.yakuTitle")}
                items={yakuDetailItems}
                total={yakuTotal}
                suffix={t("form.options.hanSuffix")}
                colSpan={TABLE_COLUMN_COUNT}
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
                  unansweredCell
                )}
                <td className="py-2 text-right font-bold text-surface-800">
                  {answer.fu}
                  {t("form.options.fuSuffix")}
                </td>
              </tr>
              {question.fuDetails && (
                <DetailsPanelRow
                  title={t("result.details.fuTitle")}
                  items={fuDetailItems}
                  total={fuTotal}
                  suffix={t("form.options.fuSuffix")}
                  colSpan={TABLE_COLUMN_COUNT}
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
                  {judged.answer.scoreFromKo !== undefined
                    ? `${judged.answer.scoreFromKo}/${judged.answer.scoreFromOya}`
                    : `${judged.answer.score}${t("result.pointSuffix")}`}{" "}
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
                unansweredCell
              )}
              <td className="space-y-1.5 py-2 text-right align-top">
                {/* 押せることが見て分かるよう、常時点線の下線を敷く */}
                <button
                  type="button"
                  onClick={() => openScoreTable(true)}
                  title={t("result.openInScoreTable")}
                  className="ml-auto block cursor-pointer text-right font-bold text-surface-800 underline decoration-surface-400 decoration-dotted decoration-2 underline-offset-4 hover:decoration-primary-500"
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
        </table>
      </div>

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

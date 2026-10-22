"use client";

import { useTranslations } from "next-intl";
import type { YakuSelectionJudgement } from "@mahjong-scoring/core";
import type { JudgedScoreAnswer } from "@mahjong-scoring/features/results/score-result-view";
import { formatPayment } from "@mahjong-scoring/features/practice/score/format-answer";
import { ReferenceLinkButton } from "@/app/(user)/_components/reference-link-button";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { AGARI_SCORE_RESULT_TOUR_ID } from "../_lib/tour-ids";
import { SCORE_TABLE_LINK_CLASSES } from "../../_lib/score-table-link-classes";
import { ResultJudgedCell, ResultUnansweredCell } from "./result-table-frame";
import { YakuJudgementChips } from "./yaku-judgement-chips";

/**
 * 答え合わせの表の行（役・翻数・符・点数）
 * 結果表の行
 *
 * それぞれ 1 つの `<tbody>`。「あなたの回答」の列は判定付きのセルか未回答の印、
 * 「正解」の列は値と、押すと資料（役一覧・点数表）が開く導線。
 */

/** 役の行。成立役のチップは押すと役一覧をその役で開く */
export function YakuRow({
  judged,
  answeredYakuJudgements,
  correctYakuJudgements,
  onOpenYakuList,
}: {
  readonly judged: JudgedScoreAnswer | undefined;
  readonly answeredYakuJudgements: readonly YakuSelectionJudgement[];
  readonly correctYakuJudgements: readonly YakuSelectionJudgement[];
  readonly onOpenYakuList: (yakuName?: string) => void;
}) {
  const t = useTranslations("agariScore");
  return (
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
              onSelect={onOpenYakuList}
            />
          </td>
        ) : (
          <ResultUnansweredCell />
        )}
        <td
          className="space-y-1.5 py-2 text-right align-top"
          data-tour-id={AGARI_SCORE_RESULT_TOUR_ID.yaku}
        >
          <YakuJudgementChips
            judgements={correctYakuJudgements}
            align="end"
            emptyLabel={t("result.details.none")}
            onSelect={onOpenYakuList}
          />
          {/* 役をタップしても開けるが、それが分かるように一覧への導線も置く */}
          <ReferenceLinkButton
            icon={<BookIcon className="size-3.5 shrink-0" />}
            label={t("result.viewYakuList")}
            onClick={() => onOpenYakuList()}
          />
        </td>
      </tr>
    </tbody>
  );
}

/**
 * 翻数の行。翻・符・点数の形を取らない回答（聴牌形の点数計算の「役なし」）は
 * `answerSummary` としてこの行に ✗ 付きで出す（役なしは翻数が無いという主張なので）
 */
export function HanRow({
  judgedHanFu,
  answerSummary,
  correctHan,
  scoreLevelName,
  hanDisplay,
}: {
  readonly judgedHanFu: JudgedScoreAnswer | undefined;
  readonly answerSummary: string | undefined;
  readonly correctHan: number;
  /** 区分で答える設定のときに添える区分名。無ければ添えない */
  readonly scoreLevelName: string | undefined;
  readonly hanDisplay: (han: number) => string;
}) {
  const t = useTranslations("agariScore");
  return (
    <tbody>
      <tr>
        <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
          {t("form.labels.han")}
        </td>
        {judgedHanFu ? (
          <ResultJudgedCell isCorrect={judgedHanFu.result.isHanCorrect}>
            {judgedHanFu.answer.han === undefined
              ? "-"
              : hanDisplay(judgedHanFu.answer.han)}
          </ResultJudgedCell>
        ) : answerSummary !== undefined ? (
          <ResultJudgedCell isCorrect={false}>{answerSummary}</ResultJudgedCell>
        ) : (
          <ResultUnansweredCell />
        )}
        <td className="py-2 text-right font-bold text-surface-800">
          {hanDisplay(correctHan)}
          {scoreLevelName !== undefined && ` (${scoreLevelName})`}
        </td>
      </tr>
    </tbody>
  );
}

/** 符の行（満貫以上では出さない。出すかは呼び出し側） */
export function FuRow({
  judgedHanFu,
  correctFu,
}: {
  readonly judgedHanFu: JudgedScoreAnswer | undefined;
  readonly correctFu: number;
}) {
  const t = useTranslations("agariScore");
  const suffix = t("form.options.fuSuffix");
  return (
    <tbody>
      <tr>
        <td className="whitespace-nowrap py-2 pr-4 text-surface-600">
          {t("form.labels.fu")}
        </td>
        {judgedHanFu ? (
          <ResultJudgedCell isCorrect={judgedHanFu.result.isFuCorrect}>
            {judgedHanFu.answer.fu ?? "-"}
            {suffix}
          </ResultJudgedCell>
        ) : (
          <ResultUnansweredCell />
        )}
        <td className="py-2 text-right font-bold text-surface-800">
          {correctFu}
          {suffix}
        </td>
      </tr>
    </tbody>
  );
}

/**
 * 点数の行。翻・符から出る最終的な答えなので、上の区切りを一段濃くし、
 * 上下の余白を広げて途中の値（翻・符）と分ける。数字をさらに大きくしないのは、
 * ツモの支払い（「1300・2600」等）が列に収まらなくなるため
 */
export function ScoreRow({
  judged,
  paymentDescription,
  onOpenScoreTable,
}: {
  readonly judged: JudgedScoreAnswer | undefined;
  /** 正解の支払い（「オール」等の表記を整形済み） */
  readonly paymentDescription: string;
  /** 点数表を開く。正解の値を押したときだけセルをハイライトする */
  readonly onOpenScoreTable: (highlight: boolean) => void;
}) {
  const t = useTranslations("agariScore");
  const tScoreTable = useTranslations("scoreTable");
  return (
    <tbody className="border-surface-300! [&>tr>td]:pt-4 [&>tr>td]:pb-3">
      <tr>
        <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
          {t("form.labels.score")}
        </td>
        {judged ? (
          <ResultJudgedCell isCorrect={judged.result.isScoreCorrect} alignTop>
            {formatPayment(judged.answer, false, { t })}
          </ResultJudgedCell>
        ) : (
          <ResultUnansweredCell />
        )}
        <td
          className="space-y-1.5 py-2 text-right align-top"
          data-tour-id={AGARI_SCORE_RESULT_TOUR_ID.score}
        >
          {/* 押せることが見て分かるよう、常時点線の下線を敷く。
              点数は翻・符から出る最終的な答えなので、正解の値の中で
              ここだけ一段大きくする（枠や色は足さない） */}
          <button
            type="button"
            onClick={() => onOpenScoreTable(true)}
            title={t("result.openInScoreTable")}
            className={`ml-auto block text-right text-base font-bold text-surface-900 ${SCORE_TABLE_LINK_CLASSES}`}
          >
            {paymentDescription}
          </button>
          {/* 点数をタップしても開けるが、それが分かるように表への導線も置く */}
          <ReferenceLinkButton
            icon={<TableIcon className="size-3.5 shrink-0" />}
            label={tScoreTable("viewScoreTable")}
            onClick={() => onOpenScoreTable(false)}
          />
        </td>
      </tr>
    </tbody>
  );
}

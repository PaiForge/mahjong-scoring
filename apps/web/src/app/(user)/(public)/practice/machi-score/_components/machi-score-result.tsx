"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  HaiKindId,
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
import { JudgementMark } from "../../_components/judgement-mark";
import {
  MACHI_TILE_MARK_CLASSES,
  machiTileMark,
  type MachiTileMark,
} from "../_lib/machi-tile-mark";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "../_hooks/use-machi-score-store";
import { WaitCellTabs, cellTabId } from "./wait-cell-tabs";

/** 内訳パネルの id。タブ（`aria-controls`）から引く */
const DETAIL_PANEL_ID = "machi-score-result-detail";

interface MachiScoreResultProps {
  readonly question: MachiScoreQuestion;
  /** 選んだ待ち牌（あなたの回答）。判定前に開示したときは空 */
  readonly selectedMachi: readonly HaiKindId[];
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
}

interface MarkedHaiProps {
  readonly hai: HaiKindId;
  /** 判定の印。無いときは枠を透明にして場所だけ取る */
  readonly mark?: MachiTileMark;
}

/**
 * 判定の印を付けた牌 1 枚
 * 印付きの牌
 *
 * 枠は印が無くても同じ太さで描く（色だけ透明にする）。印の有無で牌の
 * 大きさが変わると、「あなたの回答」と「正解」の 2 列で同じ牌が縦に
 * ずれて比べにくい。
 */
function MarkedHai({ hai, mark }: MarkedHaiProps) {
  return (
    <span
      className={`inline-flex rounded-md border-2 p-0.5 ${
        mark ? MACHI_TILE_MARK_CLASSES[mark] : "border-transparent"
      }`}
    >
      <Hai hai={hai} size="sm" />
    </span>
  );
}

/**
 * 待ち別点数計算の答え合わせ
 * 待ち別結果表示
 *
 * 上に待ち牌（あなたの回答と正解）、下に待ちごとの点数計算（マスを選ぶ
 * タブと、選んだマスの内訳）を出す。どちらも「あなたの回答」と「正解」を
 * 並べた同じ形にする — 待ちだけ正誤の一文で済ませると、点数は見比べられる
 * のに待ちは言い渡されるだけになり、外した牌が結果の画面に残らない。
 *
 * マスは表に並べず 1 つずつタブで見せる（{@link WaitCellTabs}）。1 マスの
 * 正解・正誤・自分の回答は内訳の結果表がすべて持っているので、表の上に
 * 全マスぶん並べても同じ中身が二度出るだけになる。引き換えに待ちごとの
 * 点数を並べて見比べる画面は無くなるが、それは回答の段階（マスを自分で
 * 埋める表）が担う。
 */
export function MachiScoreResult({
  question,
  selectedMachi,
  machiJudgement,
  cellAnswers,
  cellResults,
  formatAnswer,
  requireYaku,
  simplifyMangan,
  requireFuForMangan,
  onNext,
}: MachiScoreResultProps) {
  const t = useTranslations("machiScore.result");
  const tCells = useTranslations("machiScore.cells");
  const tScore = useTranslations("score");
  const tCommon = useTranslations("common");
  const cells = listCellRefs(question);
  const [focused, setFocused] = useState<MachiCellRef>(cells[0]);
  // 選んだ順ではなく牌の順に並べる。正解の列（出題の並び = 牌の順）と
  // 同じ並びになり、2 列を横に見比べられる
  const answeredMachi = [...selectedMachi].sort((a, b) => a - b);

  const cellQuestionOf = (cell: MachiCellRef): ScoreQuestion | undefined => {
    const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
    return cell.isTsumo ? wait?.tsumo : wait?.ron;
  };

  const focusedCell = focused;
  const focusedKey = cellKeyOf(focusedCell);
  const focusedQuestion = cellQuestionOf(focusedCell);
  const focusedAnswer = cellAnswers[focusedKey];
  const focusedResult = cellResults?.[focusedKey];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 待ち牌の答え合わせ。下のマスと同じく「あなたの回答」と「正解」を
          並べる（マスを押すと出る結果表 ResultDisplay と同じ 2 列の形）。
          「正解でした」の一文だけだと、点数は回答と正解を突き合わせて
          読めるのに待ちだけ結果を言い渡される形になり、どの牌を余分に
          選んだのか・どれを落としたのかが結果の画面に残らない。
          全体の正誤を名乗る見出しは置かない — 2 列を並べた時点で読めば
          分かり、回答の側に付く ✓/✗ が既に判定を持っている */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-surface-700">
          {t("machiTitle")}
        </h3>
        <div className="rounded-lg bg-surface-50 p-4">
          {/* 列幅は table-fixed で等分する（理由は ResultDisplay と同じ:
              比べさせたい 2 列の幅が中身で変わると、問題ごとに回答の牌が
              横へ動く） */}
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b-3 border-ink">
                <th className="whitespace-nowrap pb-3 pr-4 pt-2 text-right font-bold text-surface-600">
                  {tScore("result.headers.answer")}
                </th>
                <th className="whitespace-nowrap pb-3 pt-2 text-right font-bold text-surface-600">
                  {tScore("result.headers.correct")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pr-4 align-top">
                  {machiJudgement ? (
                    <span className="flex flex-wrap items-center justify-end gap-1">
                      {answeredMachi.map((hai) => (
                        <MarkedHai
                          key={hai}
                          hai={hai}
                          mark={machiTileMark(hai, true, machiJudgement)}
                        />
                      ))}
                      {/* 牌の隣なので記号も牌に釣り合う大きさにする
                          （JudgementMark の寸法は文字の em で決まる） */}
                      <span className="text-2xl leading-none">
                        <JudgementMark
                          verdict={
                            machiJudgement.isCorrect ? "correct" : "incorrect"
                          }
                          label={tCommon(
                            machiJudgement.isCorrect ? "correct" : "incorrect",
                          )}
                        />
                      </span>
                    </span>
                  ) : (
                    <span className="block text-right text-surface-400">
                      {tScore("result.unanswered")}
                    </span>
                  )}
                </td>
                <td className="py-2 align-top">
                  <span className="flex flex-wrap items-center justify-end gap-1">
                    {question.waits.map((wait) => (
                      // 選び落とした牌だけ印を残す。選んだ牌の正誤は回答の
                      // 側が既に言っていて、見落としはそこに出てこない
                      <MarkedHai
                        key={wait.agariHai}
                        hai={wait.agariHai}
                        mark={
                          machiJudgement?.missed.includes(wait.agariHai)
                            ? "missed"
                            : undefined
                        }
                      />
                    ))}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 待ちごとの点数計算の答え合わせ。マスは表に並べず、出題盤面と同じ
          姿（和了牌 + ツモ / ロン）のタブで 1 つずつ切り替える。正解と自分の
          回答はこの下の結果表が持っているので、表の上にもう一度全マスぶん
          並べると同じ中身が二度出るうえ、どのマスを押したから今の内訳が
          出ているのかが離れて分かりにくい。選んだタブがそのまま内訳の
          見出しになる形なら、押し方を注記で言わなくても伝わる */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-surface-700">
          {t("summaryTitle")}
        </h3>
        <div className="space-y-3">
          <WaitCellTabs
            cells={cells}
            cellResults={cellResults}
            focused={focusedCell}
            onFocusCell={setFocused}
            panelId={DETAIL_PANEL_ID}
          />
          <div
            id={DETAIL_PANEL_ID}
            role="tabpanel"
            aria-labelledby={cellTabId(focusedCell)}
          >
            {focusedQuestion ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <TehaiMentsuBreakdown
                    tehai={focusedQuestion.tehai}
                    context={focusedQuestion}
                  />
                </div>
                <ResultDisplay
                  key={focusedKey}
                  question={focusedQuestion}
                  userAnswer={
                    focusedAnswer?.kind === "score"
                      ? focusedAnswer.answer
                      : undefined
                  }
                  result={
                    focusedAnswer?.kind === "score" ? focusedResult : undefined
                  }
                  // 「役なし」と答えたマスは翻・符・点数を持たないので、一言で列に出す
                  answerSummary={
                    focusedAnswer?.kind === "noYaku"
                      ? tCells("noYakuShort")
                      : undefined
                  }
                  requireYaku={requireYaku}
                  simplifyMangan={simplifyMangan}
                  requireFuForMangan={requireFuForMangan}
                />
              </div>
            ) : (
              <HighlightPanel>
                <p className="text-sm leading-relaxed text-surface-800">
                  {t("noYakuDetail")}
                </p>
                {focusedAnswer !== undefined && focusedResult !== undefined && (
                  <p
                    className={`mt-2 text-sm font-bold ${
                      focusedResult.isCorrect
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {t("yourAnswer")}:{" "}
                    {formatAnswer(focusedAnswer, focusedCell.isTsumo)}{" "}
                    <JudgementMark
                      verdict={
                        focusedResult.isCorrect ? "correct" : "incorrect"
                      }
                      label={tCommon(
                        focusedResult.isCorrect ? "correct" : "incorrect",
                      )}
                    />
                  </p>
                )}
              </HighlightPanel>
            )}
          </div>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={onNext}>
        {tScore("result.next")}
      </Button>
    </div>
  );
}

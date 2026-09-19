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
import { ResultDisplay } from "../../score/_components/result-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { JudgementMark } from "../../_components/judgement-mark";
import { correctCellAnswerOf } from "../_lib/format-cell-answer";
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
import { NoYakuResultDisplay } from "./no-yaku-result-display";
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
  /** 回答を「翻・符」「支払い」の行に分ける（`formatCellAnswerLines`） */
  readonly formatAnswerLines: (
    answer: MachiCellAnswer,
    isTsumo: boolean,
  ) => readonly string[];
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
 * マスは表に並べず 1 つずつタブで見せる（{@link WaitCellTabs}）。タブには
 * 正解の点数を添え、待ちごとの点数を並べて見比べる役目はタブの列が持つ。
 * 自分の回答と正誤・内訳はタブの下のパネルがすべて持っているので、表の
 * 上に全マスぶん並べると同じ中身が二度出るだけになる。役が無くロン
 * できないマスも同じ形の表で出す（{@link NoYakuResultDisplay}）ので、
 * どのタブでもパネルの形は変わらない。
 *
 * パネルは墨の枠で囲み、選択中のタブと地続きにする（枠の重ね方は
 * {@link WaitCellTabs}）。面子分解のリンクはパネルの末尾、結果表の下に
 * 置く — タブと表の間に挟むと、つながって見せたいタブと表が 1 行ぶん
 * 離れる。分解は「点数を読んでから確かめたいときに開く」導線なので、
 * 表の後ろでも読む順に沿う。
 */
export function MachiScoreResult({
  question,
  selectedMachi,
  machiJudgement,
  cellAnswers,
  cellResults,
  formatAnswerLines,
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
          姿（和了牌 + ツモ / ロン + 正解の点数）のタブで 1 つずつ切り替える。
          自分の回答と内訳はこの下の結果表が持っているので、表の上にもう
          一度全マスぶん並べると同じ中身が二度出るうえ、どのマスを押したから
          今の内訳が出ているのかが離れて分かりにくい。選んだタブがそのまま
          内訳の見出しになる形なら、押し方を注記で言わなくても伝わる */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-surface-700">
          {t("summaryTitle")}
        </h3>
        <div>
          <WaitCellTabs
            cells={cells}
            cellResults={cellResults}
            focused={focusedCell}
            onFocusCell={setFocused}
            correctAnswerLinesOf={(cell) =>
              formatAnswerLines(
                correctCellAnswerOf(cellQuestionOf(cell)),
                cell.isTsumo,
              )
            }
            panelId={DETAIL_PANEL_ID}
          />
          {/* 上枠は選択中のタブが覆う。上の角は左右とも丸めず、上辺を端から
              端までの 1 本の直線にする。端のタブを選んだときはタブの枠が
              そのままパネルの枠に続き、タブが収まらず横スクロールになった
              ときは、右端で断ち切られたタブの切り口とパネルの上辺が同じ
              位置で揃う（右上だけ丸めると、内側へ曲がった角の真上に
              まっすぐな切り口が残って食い違う）。下の角は丸める */}
          <div
            id={DETAIL_PANEL_ID}
            role="tabpanel"
            aria-labelledby={cellTabId(focusedCell)}
            className="rounded-b-lg border-3 border-ink bg-white p-3 sm:p-4"
          >
            {focusedQuestion ? (
              <div className="space-y-3">
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
                <TehaiMentsuBreakdown
                  tehai={focusedQuestion.tehai}
                  context={focusedQuestion}
                />
              </div>
            ) : (
              <NoYakuResultDisplay
                userAnswer={focusedAnswer}
                result={focusedResult}
                requireYaku={requireYaku}
                simplifyMangan={simplifyMangan}
              />
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

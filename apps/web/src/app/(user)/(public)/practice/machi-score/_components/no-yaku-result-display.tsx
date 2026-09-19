"use client";

import { useTranslations } from "next-intl";
import type {
  JudgementResult,
  MachiCellAnswer,
  UserAnswer,
} from "@mahjong-scoring/core";
import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { JudgementMark } from "../../_components/judgement-mark";
import { practiceHanTier } from "../../score/_lib/han-tiers";
import {
  ResultTableFrame,
  ResultUnansweredCell,
} from "../../score/_components/result-table-frame";

interface JudgedCellProps {
  readonly value: string;
  readonly isCorrect: boolean;
}

/** 正誤の色と記号を付けた「あなたの回答」の値のセル（`ResultDisplay` と同じ姿） */
function JudgedCell({ value, isCorrect }: JudgedCellProps) {
  const tCommon = useTranslations("common");
  return (
    <td
      className={`py-2 pr-4 text-right align-top ${
        isCorrect ? "text-success" : "text-destructive"
      }`}
    >
      {value}{" "}
      <JudgementMark
        verdict={isCorrect ? "correct" : "incorrect"}
        label={tCommon(isCorrect ? "correct" : "incorrect")}
      />
    </td>
  );
}

interface NoYakuResultDisplayProps {
  /** マスへの回答。「わからない」での開示では undefined */
  readonly userAnswer: MachiCellAnswer | undefined;
  /** マスの判定。開示では undefined */
  readonly result: JudgementResult | undefined;
  readonly requireYaku: boolean;
  readonly simplifyMangan: boolean;
}

/**
 * 役が無くロンできないマスの答え合わせ
 * 役なしの結果表示
 *
 * 正解が「役なし」のマスは点数の出題（`ScoreQuestion`）を持たないので
 * `ResultDisplay` に渡せない。それでも同じ枠（{@link ResultTableFrame}）、
 * 同じ行（役・翻数・符・点数）の表で出す — 一文の囲みに変えると、その
 * タブに切り替えたときだけ表が消えて画面の形が変わるし、役なしのマスに
 * 点数を当てはめた誤答が「あなたの回答」として行ごとに ✗ 付きで残らない
 * （どこまで間違えたかを読ませたい）。
 *
 * 「役なし」は翻数の行に置く。役なしは翻数が無いという主張なので、
 * `ResultDisplay` が回答の「役なし」を置く行に揃える。符と点数の行は
 * 正解も回答も値を持たないので「—」。役なしと答えた回答は翻数の行に
 * ✓ を付け、他の行は未回答の印にする（`ResultDisplay` の `answerSummary`
 * と同じ扱い）。表の下に、なぜ和了れないかの一文を添える。
 */
export function NoYakuResultDisplay({
  userAnswer,
  result,
  requireYaku,
  simplifyMangan,
}: NoYakuResultDisplayProps) {
  const t = useTranslations("machiScore");
  const tScore = useTranslations("score");
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  // 点数で答えた（= 役なしのマスに対する誤答）ときだけ翻・符・点数の行に値が入る
  const scoreAnswer =
    userAnswer?.kind === "score" && result !== undefined
      ? { answer: userAnswer.answer, result }
      : undefined;
  const noYakuResult =
    userAnswer?.kind === "noYaku" && result !== undefined ? result : undefined;

  const hanDisplay = (han: number) => {
    const tier = simplifyMangan
      ? practiceHanTier(han, allowDoubleYakuman)
      : undefined;
    return tier
      ? tScore(`form.options.${tier.key}`)
      : `${han}${tScore("form.options.hanSuffix")}`;
  };
  const paymentDisplay = (answer: UserAnswer) =>
    answer.scoreFromKo !== undefined
      ? `${answer.scoreFromKo}/${answer.scoreFromOya}`
      : `${answer.score}${tScore("result.pointSuffix")}`;

  const labelCell = (label: string) => (
    <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
      {label}
    </td>
  );
  const correctCell = (value: string) => (
    <td className="py-2 text-right align-top font-bold text-surface-800">
      {value}
    </td>
  );
  const notApplicable = t("result.notApplicable");

  return (
    <div className="space-y-3">
      <ResultTableFrame>
        {requireYaku && (
          <tbody>
            <tr>
              {labelCell(tScore("form.labels.yaku"))}
              {scoreAnswer ? (
                <JudgedCell
                  value={
                    scoreAnswer.answer.yakus.length > 0
                      ? scoreAnswer.answer.yakus.join("、")
                      : tScore("result.details.none")
                  }
                  isCorrect={scoreAnswer.result.isYakuCorrect}
                />
              ) : (
                <ResultUnansweredCell />
              )}
              {correctCell(tScore("result.details.none"))}
            </tr>
          </tbody>
        )}
        <tbody>
          <tr>
            {labelCell(tScore("form.labels.han"))}
            {scoreAnswer ? (
              <JudgedCell
                value={hanDisplay(scoreAnswer.answer.han)}
                isCorrect={scoreAnswer.result.isHanCorrect}
              />
            ) : noYakuResult ? (
              <JudgedCell
                value={t("cells.noYakuShort")}
                isCorrect={noYakuResult.isCorrect}
              />
            ) : (
              <ResultUnansweredCell />
            )}
            {correctCell(t("cells.noYakuShort"))}
          </tr>
        </tbody>
        <tbody>
          <tr>
            {labelCell(tScore("form.labels.fu"))}
            {scoreAnswer ? (
              <JudgedCell
                value={`${scoreAnswer.answer.fu ?? "-"}${tScore("form.options.fuSuffix")}`}
                isCorrect={scoreAnswer.result.isFuCorrect}
              />
            ) : (
              <ResultUnansweredCell />
            )}
            {correctCell(notApplicable)}
          </tr>
        </tbody>
        <tbody>
          <tr>
            {labelCell(tScore("form.labels.score"))}
            {scoreAnswer ? (
              <JudgedCell
                value={paymentDisplay(scoreAnswer.answer)}
                isCorrect={scoreAnswer.result.isScoreCorrect}
              />
            ) : (
              <ResultUnansweredCell />
            )}
            {correctCell(notApplicable)}
          </tr>
        </tbody>
      </ResultTableFrame>
      <p className="text-sm leading-relaxed text-surface-600">
        {t("result.noYakuDetail")}
      </p>
    </div>
  );
}

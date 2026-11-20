"use client";

import { useTranslations } from "next-intl";
import { useAllowDoubleYakuman } from "@/app/_hooks/use-rule-settings-store";
import { JudgementMark } from "../../_components/judgement-mark";
import { buildNoYakuResultRows } from "@mahjong-scoring/features/practice/tenpai-score/no-yaku-result-rows";
import {
  ResultTableFrame,
  ResultUnansweredCell,
} from "../../agari-score/_components/result-table-frame";
import type { NoYakuResultDisplayProps } from "@mahjong-scoring/features/practice/tenpai-score/result-props";

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
 * どの行に何を置くか（「役なし」は翻数の行、符と点数の正解は「—」、役なしと
 * 答えた回答は翻数の行にだけ ✓ を付けて他の行は未回答の印）はアプリと共有の
 * {@link buildNoYakuResultRows} が決める。ここは表のセルに描くだけ。
 * 表の下に、なぜ和了れないかの一文を添える。
 */
export function NoYakuResultDisplay(props: NoYakuResultDisplayProps) {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tYakuNames = useTranslations("yakuNames");
  const tCommon = useTranslations("common");
  const allowDoubleYakuman = useAllowDoubleYakuman();
  const rows = buildNoYakuResultRows(props, {
    t,
    tScore,
    tYakuNames,
    tCommon,
    allowDoubleYakuman,
  });

  return (
    <div className="space-y-3">
      <ResultTableFrame embedded>
        {rows.map((row) => (
          <tbody key={row.key}>
            <tr>
              <td className="whitespace-nowrap py-2 pr-4 align-top text-surface-600">
                {row.label}
              </td>
              {row.answer.kind === "judged" ? (
                <JudgedCell
                  value={row.answer.value}
                  isCorrect={row.answer.isCorrect}
                />
              ) : (
                <ResultUnansweredCell />
              )}
              <td className="py-2 text-right align-top font-bold text-surface-800">
                {row.correct}
              </td>
            </tr>
          </tbody>
        ))}
      </ResultTableFrame>
      <p className="text-sm leading-relaxed text-surface-600">
        {t("result.noYakuDetail")}
      </p>
    </div>
  );
}

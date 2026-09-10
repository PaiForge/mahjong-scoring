"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

import { formatScoreAnswer } from "../_lib/format-score-answer";
import { ScoreTableModal } from "../score/_components/score-table-modal";

interface RevealedScoreAnswerProps {
  /** 開示する正解の点数 */
  readonly answer: ScoreTableAnswer;
  /** `revealedAnswer` / `pointSuffix` / `all` キーを持つ翻訳名前空間 */
  readonly translationNamespace: string;
  /**
   * 正解を押したときに開く点数表の位置（親子・ロンツモ・翻・符）
   *
   * 渡すと正解の点数が押せる文字になり、そのセルをハイライトした点数早見表を
   * モーダルで開く（{@link import("../_lib/score-table-focus").scoreTableFocusOf}
   * で組む）。渡さなければただの文字。
   */
  readonly scoreTableFocus?: ScoreTableFocus;
}

/**
 * トレーニングで開示する正解の点数
 * 正解開示表示
 *
 * 点数を答える練習（点数表早引き・点数計算）は選択肢を持たないため、回答の
 * フィードバックだけでは正解値が分からない。「わからない」と不正解のあとに
 * 出題文の行と差し替えて出す（{@link import("./question-prompt").QuestionPrompt}
 * の `replacement`）。正解のときは出さない — 選んだ値がそのまま正解で、
 * 枠の色が正誤を示している。
 *
 * 正解の点数は、点数計算の無限訓練の答え合わせや結果ページの問題別詳細と
 * 同じく押せる（`scoreTableFocus`）。値を読むだけでは「なぜその点数か」が
 * 分からず、表のどこに載っているかを見て初めて次に引けるようになる。
 * 押せることは常時の点線の下線で示す（無限訓練の答え合わせと同じ記号）。
 * 表への補助リンクは置かない — この行は出題文と同じ 1 行に収める約束で、
 * 行を増やすと下の回答欄が動く。
 *
 * 出題文と同じ 1 行（20px）に収めるため行間を `leading-5` に詰める。行を
 * 高くすると差し替えた瞬間に回答欄が動く。ロンの点数には単位が無いため
 * 「点」を付ける。
 */
export function RevealedScoreAnswer({
  answer,
  translationNamespace,
  scoreTableFocus,
}: RevealedScoreAnswerProps) {
  const t = useTranslations(translationNamespace);
  const tChallenge = useTranslations("challenge");
  const [isScoreTableOpen, setIsScoreTableOpen] = useState(false);

  const formatted = formatScoreAnswer(answer, (key) => t(key), {
    ronSuffix: t("pointSuffix"),
  });

  return (
    <>
      <p className="text-center text-base leading-5 font-bold text-surface-800">
        {t.rich("revealedAnswer", {
          answer: () =>
            scoreTableFocus === undefined ? (
              formatted
            ) : (
              <button
                type="button"
                onClick={() => setIsScoreTableOpen(true)}
                title={tChallenge("openInScoreTable")}
                className="cursor-pointer font-bold underline decoration-surface-400 decoration-dotted decoration-2 underline-offset-4 hover:decoration-primary-500"
              >
                {formatted}
              </button>
            ),
        })}
      </p>

      {scoreTableFocus !== undefined && (
        <ScoreTableModal
          isOpen={isScoreTableOpen}
          onClose={() => setIsScoreTableOpen(false)}
          focus={scoreTableFocus}
          highlighted
        />
      )}
    </>
  );
}

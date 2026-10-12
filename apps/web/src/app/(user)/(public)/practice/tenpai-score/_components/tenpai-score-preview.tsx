"use client";

import { useTranslations } from "next-intl";
import { isOya } from "@mahjong-scoring/core";
import { buildTenpaiHelpCells } from "@mahjong-scoring/features/practice/help-tour-sample";
import { cellAnswerFormatters } from "@mahjong-scoring/features/practice/tenpai-score/format-cell-answer";
import { TENPAI_SCORE_DEMO_QUESTION } from "@mahjong-scoring/features/practice/tenpai-score/demo-question";
import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

const noop = () => {};

/** 全マスを正解で埋めた回答（固定の出題なのでモジュールで 1 回だけ組む） */
const { answers: DEMO_ANSWERS } = buildTenpaiHelpCells(
  TENPAI_SCORE_DEMO_QUESTION,
);

/**
 * 聴牌形の点数計算のプレビュー
 * 聴牌形プレビュー
 *
 * 練習の外（「このアプリについて」）で、この練習の盤面を見せる。固定の
 * 出題（{@link TENPAI_SCORE_DEMO_QUESTION}）の聴牌形と、待ち × ツモ / ロンの
 * マスをすべて埋めた状態を描く — 待ちによって点数が変わることが、マスの
 * 並びを見るだけで分かるように。押せない（操作は渡さず `disabled`）。
 *
 * 裏ドラは開いておく。練習では点数を答える段階で開くもので、マスが
 * 埋まっているこの状態と揃える。
 */
export function TenpaiScorePreview() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const { formatAnswer } = cellAnswerFormatters({
    t: tScore,
    noYakuLabel: t("cells.noYakuShort"),
    exactHan: false,
    allowDoubleYakuman: false,
    isOya: isOya(TENPAI_SCORE_DEMO_QUESTION.jikaze),
  });

  return (
    <div className="space-y-4">
      <TenpaiDisplay question={TENPAI_SCORE_DEMO_QUESTION} showUraDora />
      <WaitCellGrid
        question={TENPAI_SCORE_DEMO_QUESTION}
        cellAnswers={DEMO_ANSWERS}
        selectedCells={[]}
        formatAnswer={formatAnswer}
        onToggleCell={noop}
        disabled
      />
    </div>
  );
}

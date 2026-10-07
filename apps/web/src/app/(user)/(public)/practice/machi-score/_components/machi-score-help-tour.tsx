"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  generateValidMachiScoreQuestion,
  judgeMachiSelection,
  isOya,
} from "@mahjong-scoring/core";
import type {
  JudgementResult,
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import {
  HelpTourButton,
  HelpTourModal,
} from "../../_components/help-tour-modal";
import type { HelpTourSlide } from "../../_components/help-tour-modal";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "@mahjong-scoring/features/practice/machi-score/cell-ref";
import {
  correctCellAnswerOf,
  cellAnswerFormatters,
} from "@mahjong-scoring/features/practice/machi-score/format-cell-answer";
import { HELP_TOUR_ALL_CORRECT } from "@mahjong-scoring/features/practice/help-tour-sample";
import { useHelpTourSample } from "@mahjong-scoring/features/practice/use-help-tour-sample";
import { MachiPicker } from "./machi-picker";
import { MachiScoreResult } from "./machi-score-result";
import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

/**
 * 聴牌形の点数計算 ヘルプツアー
 *
 * @description
 * 設定画面の PageTitle 右端に置く「?」ボタン。押すと「開始する」後の 3 段階
 * （待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ）を実コンポーネントで
 * 見せるカルーセルモーダル（{@link HelpTourModal}）を開く。この練習は 1 問の
 * 中に段階があり、始める前に流れを通しで見せた方が迷わない。
 *
 * @flow
 * 1. 「?」を押すとモーダルが開く（初回開封時に門前のサンプル問題を生成）
 * 2. 待ち牌・マス・答え合わせの 3 スライドを「戻る/次へ」で閲覧
 * 3. 「閉じる」またはオーバーレイクリック / Esc で終了
 */

const noop = () => {};

/** 副露なしの分かりやすいサンプル */
function generateSample(): MachiScoreQuestion | undefined {
  return generateValidMachiScoreQuestion({ includeFuro: false });
}

/** 全マスを正解で埋めた回答と、その判定 */
function buildCorrectCells(question: MachiScoreQuestion): {
  readonly answers: Readonly<Record<string, MachiCellAnswer>>;
  readonly results: Readonly<Record<string, JudgementResult>>;
} {
  const answers: Record<string, MachiCellAnswer> = {};
  const results: Record<string, JudgementResult> = {};
  for (const wait of question.waits) {
    answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: true })] =
      correctCellAnswerOf(wait.tsumo);
    answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: false })] =
      correctCellAnswerOf(wait.ron);
  }
  for (const cell of listCellRefs(question))
    results[cellKeyOf(cell)] = HELP_TOUR_ALL_CORRECT;
  return { answers, results };
}

export function MachiScoreHelpTour() {
  const t = useTranslations("machiScore");
  const tScore = useTranslations("score");
  const tCommon = useTranslations("common");
  const { isOpen, sample, open, close } = useHelpTourSample(generateSample);

  const slides = useMemo((): readonly HelpTourSlide[] => {
    if (!sample) return [];
    const waits = sample.waits.map((wait) => wait.agariHai);
    const { answers, results } = buildCorrectCells(sample);
    const isOyaQuestion = isOya(sample.jikaze);
    const { formatAnswer, formatAnswerLines } = cellAnswerFormatters({
      t: tScore,
      noYakuLabel: t("cells.noYakuShort"),
      simplifyMangan: false,
      allowDoubleYakuman: false,
      isOya: isOyaQuestion,
    });
    // マスのスライドはツモ列を回答済み、ロン列を選択中の途中経過で見せる
    const tsumoAnswers: Record<string, MachiCellAnswer> = {};
    const ronCells: MachiCellRef[] = [];
    for (const cell of listCellRefs(sample)) {
      const key = cellKeyOf(cell);
      if (cell.isTsumo) tsumoAnswers[key] = answers[key];
      else ronCells.push(cell);
    }

    return [
      {
        key: "machi",
        title: t("help.slides.machi.title"),
        caption: t("help.slides.machi.caption"),
        node: (
          <div className="space-y-4">
            <TenpaiDisplay question={sample} showUraDora={false} />
            <MachiPicker
              selected={waits}
              onToggle={noop}
              judgement={judgeMachiSelection(sample, waits)}
              disabled
            />
          </div>
        ),
      },
      {
        key: "cells",
        title: t("help.slides.cells.title"),
        caption: t("help.slides.cells.caption"),
        node: (
          <div className="space-y-4">
            <TenpaiDisplay question={sample} showUraDora />
            <WaitCellGrid
              question={sample}
              cellAnswers={tsumoAnswers}
              selectedCells={ronCells}
              formatAnswer={formatAnswer}
              onToggleCell={noop}
              disabled
            />
          </div>
        ),
      },
      {
        key: "result",
        title: t("help.slides.result.title"),
        caption: t("help.slides.result.caption"),
        node: (
          <MachiScoreResult
            question={sample}
            selectedMachi={waits}
            machiJudgement={judgeMachiSelection(sample, waits)}
            cellAnswers={answers}
            cellResults={results}
            formatAnswerLines={formatAnswerLines}
            requireYaku={false}
            simplifyMangan={false}
            requireFuForMangan={false}
            onNext={noop}
          />
        ),
      },
    ];
  }, [sample, t, tScore]);

  return (
    <>
      <HelpTourButton onClick={open} label={t("help.label")} />
      <HelpTourModal
        isOpen={isOpen}
        onClose={close}
        title={t("help.title")}
        slides={slides}
        labels={{
          close: tCommon("close"),
          prev: t("help.prev"),
          next: t("help.next"),
        }}
      />
    </>
  );
}

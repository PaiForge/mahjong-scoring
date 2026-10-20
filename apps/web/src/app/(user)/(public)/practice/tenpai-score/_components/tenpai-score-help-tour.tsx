"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { practiceHelpTourLabels } from "@mahjong-scoring/features/practice/help-tour-labels";
import { judgeMachiSelection } from "@mahjong-scoring/core";
import {
  HelpTourButton,
  HelpTourModal,
} from "../../_components/help-tour-modal";
import type { HelpTourSlide } from "../../_components/help-tour-modal";
import {
  answerFieldsOf,
  buildTenpaiHelpCells,
  generateTenpaiHelpSample,
  tenpaiHelpCellFormatters,
  tenpaiHelpProgress,
} from "@mahjong-scoring/features/practice/help-tour-sample";
import { useHelpTourSample } from "@mahjong-scoring/features/practice/use-help-tour-sample";
import { useTenpaiScoreSettingsStore } from "../_hooks/use-tenpai-score-settings-store";
import { MachiPicker } from "./machi-picker";
import { TenpaiScoreResult } from "./tenpai-score-result";
import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

/**
 * 聴牌形の点数計算 ヘルプツアー
 *
 * @description
 * 設定画面の PageTitle 右端に置く「?」ボタン。押すと「開始する」後の 3 段階
 * （待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ）を実コンポーネントで
 * 見せるカルーセルモーダル（{@link HelpTourModal}）を開く。この練習は 1 問の
 * 中に段階があり、始める前に流れを通しで見せた方が迷わない。マスの回答と
 * 答え合わせは、同じ画面の設定（翻数と符も回答するか）に合わせて描く。
 *
 * @flow
 * 1. 「?」を押すとモーダルが開く（初回開封時に門前のサンプル問題を生成）
 * 2. 待ち牌・マス・答え合わせの 3 スライドを「戻る/次へ」で閲覧
 * 3. 「閉じる」またはオーバーレイクリック / Esc で終了
 */

const noop = () => {};

export function TenpaiScoreHelpTour() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const { isOpen, sample, open, close } = useHelpTourSample(
    generateTenpaiHelpSample,
  );
  const requireHanFu = useTenpaiScoreSettingsStore((s) => s.requireHanFu);

  const slides = useMemo((): readonly HelpTourSlide[] => {
    if (!sample) return [];
    const waits = sample.waits.map((wait) => wait.agariHai);
    const { answers, results } = buildTenpaiHelpCells(sample, {
      requireHanFu,
    });
    const { formatAnswer, formatAnswerLines } = tenpaiHelpCellFormatters(
      sample,
      { t: tScore, noYakuLabel: t("cells.noYakuShort") },
    );
    // マスのスライドはツモ列を回答済み、ロン列を選択中の途中経過で見せる
    const { tsumoAnswers, ronCells } = tenpaiHelpProgress(sample, answers);

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
        caption: t("help.slides.cells.caption", answerFieldsOf(requireHanFu)),
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
          <TenpaiScoreResult
            question={sample}
            selectedMachi={waits}
            machiJudgement={judgeMachiSelection(sample, waits)}
            cellAnswers={answers}
            cellResults={results}
            formatAnswerLines={formatAnswerLines}
            requireYaku={false}
            requireHanFu={requireHanFu}
            exactHan={false}
            requireFuForMangan={false}
            onNext={noop}
          />
        ),
      },
    ];
  }, [sample, t, tScore, requireHanFu]);

  return (
    <>
      <HelpTourButton onClick={open} label={t("help.label")} />
      <HelpTourModal
        isOpen={isOpen}
        onClose={close}
        title={t("help.title")}
        slides={slides}
        labels={practiceHelpTourLabels(t, tCommon)}
      />
    </>
  );
}

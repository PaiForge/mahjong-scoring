import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { practiceHelpTourLabels } from "@mahjong-scoring/features/practice/help-tour-labels";
import { judgeMachiSelection } from "@mahjong-scoring/core";
import {
  answerFieldsOf,
  buildTenpaiHelpCells,
  generateTenpaiHelpSample,
  tenpaiHelpCellFormatters,
  tenpaiHelpProgress,
} from "@mahjong-scoring/features/practice/help-tour-sample";
import { useHelpTourSample } from "@mahjong-scoring/features/practice/use-help-tour-sample";

import { HelpIconButton } from "../../../components/help-icon-button";
import { useTenpaiScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import {
  HelpTourSheet,
  type HelpTourStep,
} from "../../../components/help-tour-sheet";
import {
  OperationHelp,
  operationHelpSteps,
} from "../../../components/operation-help";
import { MachiPicker } from "./machi-picker";
import { TenpaiScoreResult } from "./tenpai-score-result";
import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

const noop = () => {};

/** 見出しの「?」の大きさ（ヘッダーの見出しの文字に合わせる） */
const HEADER_HELP_FONT_SIZE = 17;

/**
 * 聴牌形の点数計算の進め方（設定画面の「?」。web の `TenpaiScoreHelpTour`）
 * 聴牌形ヘルプツアー
 *
 * 1 問の中の 3 段階（待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ）を
 * 実物のコンポーネントで 1 枚ずつ見せる。マスの 1 枚はツモ列を回答済み、
 * ロン列を選択中の途中経過で見せる（web と同じ）。マスの回答と答え合わせは、
 * 同じ画面の設定（翻数と符も回答するか）に合わせて描く。
 */
export function TenpaiScoreHelpTour() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const { isOpen, sample, open, close } = useHelpTourSample(
    generateTenpaiHelpSample,
  );
  const requireHanFu = useTenpaiScoreSettingsStore((s) => s.requireHanFu);

  const steps = useMemo((): readonly HelpTourStep[] => {
    if (sample === undefined) return [];
    const waits = sample.waits.map((wait) => wait.agariHai);
    const { answers, results } = buildTenpaiHelpCells(sample, {
      requireHanFu,
    });
    const { formatAnswer, formatAnswerLines } = tenpaiHelpCellFormatters(
      sample,
      { t: tScore, noYakuLabel: t("cells.noYakuShort") },
    );
    const { tsumoAnswers, ronCells } = tenpaiHelpProgress(sample, answers);

    return [
      {
        key: "machi",
        title: t("help.slides.machi.title"),
        description: t("help.slides.machi.caption"),
        node: (
          <View style={styles.sample}>
            <TenpaiDisplay question={sample} showUraDora={false} />
            <MachiPicker
              selected={waits}
              onToggle={noop}
              judgement={judgeMachiSelection(sample, waits)}
            />
          </View>
        ),
      },
      {
        key: "cells",
        title: t("help.slides.cells.title"),
        description: t(
          "help.slides.cells.caption",
          answerFieldsOf(requireHanFu),
        ),
        node: (
          <View style={styles.sample}>
            <TenpaiDisplay question={sample} showUraDora />
            <WaitCellGrid
              question={sample}
              cellAnswers={tsumoAnswers}
              selectedCells={ronCells}
              formatAnswer={formatAnswer}
              onToggleCell={noop}
            />
          </View>
        ),
      },
      {
        key: "result",
        title: t("help.slides.result.title"),
        description: t("help.slides.result.caption"),
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
      <HelpIconButton
        onPress={open}
        label={t("help.label")}
        fontSize={HEADER_HELP_FONT_SIZE}
      />
      <HelpTourSheet
        isOpen={isOpen}
        onClose={close}
        title={t("help.title")}
        steps={steps}
        labels={practiceHelpTourLabels(t, tCommon)}
      />
    </>
  );
}

/**
 * 聴牌形の点数計算の画面の操作（play 画面の「?」。web の `TenpaiScoreSpotlightTour`）
 * 聴牌形の操作ヘルプ
 *
 * いまの段階の画面にある要素だけを 1 枚ずつ説明する（待ち牌の段階と、マスに
 * 当てはめる段階で中身が変わる。答え合わせの段階では「?」を出さない）。
 * 回答欄の説明は、翻数と符も答える設定かで「翻・符・点数」と「点数」を言い分ける。
 */
export function TenpaiScoreOperationHelp({
  phase,
  requireHanFu,
}: {
  readonly phase: "machi" | "cells";
  /** 翻数と符も答える設定か */
  readonly requireHanFu: boolean;
}) {
  const t = useTranslations("tenpaiScore.tour");
  const keys =
    phase === "machi"
      ? ["board", "picker", "machiSubmit"]
      : ["board", "cells", "answerForm", "cellsSubmit"];
  return (
    <OperationHelp
      namespace="tenpaiScore.tour"
      steps={operationHelpSteps(t, keys, {
        answerForm: answerFieldsOf(requireHanFu),
      })}
    />
  );
}

const styles = StyleSheet.create({
  sample: {
    gap: 16,
  },
});

import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  isOya,
  judgeMachiSelection,
  type MachiCellAnswer,
} from "@mahjong-scoring/core";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "@mahjong-scoring/features/practice/tenpai-score/cell-ref";
import { cellAnswerFormatters } from "@mahjong-scoring/features/practice/tenpai-score/format-cell-answer";
import {
  buildTenpaiHelpCells,
  generateTenpaiHelpSample,
} from "@mahjong-scoring/features/practice/help-tour-sample";
import { useHelpTourSample } from "@mahjong-scoring/features/practice/use-help-tour-sample";

import { HelpIconButton } from "../../../components/help-icon-button";
import {
  HelpTourSheet,
  type HelpTourStep,
} from "../../../components/help-tour-sheet";
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
 * ロン列を選択中の途中経過で見せる（web と同じ）。
 */
export function TenpaiScoreHelpTour() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const { isOpen, sample, open, close } = useHelpTourSample(
    generateTenpaiHelpSample,
  );

  const steps = useMemo((): readonly HelpTourStep[] => {
    if (sample === undefined) return [];
    const waits = sample.waits.map((wait) => wait.agariHai);
    const { answers, results } = buildTenpaiHelpCells(sample);
    const { formatAnswer, formatAnswerLines } = cellAnswerFormatters({
      t: tScore,
      noYakuLabel: t("cells.noYakuShort"),
      exactHan: false,
      allowDoubleYakuman: false,
      isOya: isOya(sample.jikaze),
    });
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
        description: t("help.slides.cells.caption"),
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
            exactHan={false}
            requireFuForMangan={false}
            onNext={noop}
          />
        ),
      },
    ];
  }, [sample, t, tScore]);

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
        labels={{
          prev: t("help.prev"),
          next: t("help.next"),
          close: tCommon("close"),
          progress: (current, total) => t("tour.progress", { current, total }),
        }}
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
 */
export function TenpaiScoreOperationHelp({
  phase,
}: {
  readonly phase: "machi" | "cells";
}) {
  const t = useTranslations("tenpaiScore.tour");
  const [isOpen, setIsOpen] = useState(false);

  const keys =
    phase === "machi"
      ? (["board", "picker", "machiSubmit"] as const)
      : (["board", "cells", "answerForm", "cellsSubmit"] as const);
  const steps: readonly HelpTourStep[] = keys.map((key) => ({
    key,
    title: t(`${key}.title`),
    description: t(`${key}.description`),
  }));

  return (
    <>
      <HelpIconButton
        onPress={() => setIsOpen(true)}
        label={t("label")}
        fontSize={HEADER_HELP_FONT_SIZE}
      />
      <HelpTourSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        steps={steps}
        labels={{
          prev: t("prev"),
          next: t("next"),
          close: t("done"),
          progress: (current, total) => t("progress", { current, total }),
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sample: {
    gap: 16,
  },
});

import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  generateValidScoreQuestion,
  isOya,
  type ScoreQuestion,
} from "@mahjong-scoring/core";
import { HELP_TOUR_ALL_CORRECT } from "@mahjong-scoring/features/practice/help-tour-sample";
import { useHelpTourSample } from "@mahjong-scoring/features/practice/use-help-tour-sample";
import { scoreAnswerToUserAnswer } from "@mahjong-scoring/features/results/payment-adapter";

import { Button } from "../../../components/button";
import { HelpIconButton } from "../../../components/help-icon-button";
import {
  HelpTourSheet,
  type HelpTourStep,
} from "../../../components/help-tour-sheet";
import { QuestionDisplay } from "../../components/question-display";
import { ResultDisplay } from "./result-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";

const noop = () => {};

/** 副露・七対子なしの分かりやすいサンプル（web と同じ） */
function generateSample(): ScoreQuestion | undefined {
  return generateValidScoreQuestion({
    includeFuro: false,
    includeChiitoi: false,
  });
}

/** 見出しの「?」の大きさ（ヘッダーの見出しの文字に合わせる） */
const HEADER_HELP_FONT_SIZE = 17;

/**
 * 和了形の点数計算の進め方（設定画面の「?」。web の `AgariScoreHelpTour`）
 * 和了形の点数計算ヘルプツアー
 *
 * 開始後の画面（問題 → 回答 → 結果）を実物のコンポーネントで 1 枚ずつ見せる。
 * サンプル問題は初めて開いたときに 1 度だけ作って固定する。
 */
export function AgariScoreHelpTour() {
  const t = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const { isOpen, sample, open, close } = useHelpTourSample(generateSample);

  const steps = useMemo((): readonly HelpTourStep[] => {
    if (sample === undefined) return [];
    return [
      {
        key: "question",
        title: t("help.slides.question.title"),
        description: t("help.slides.question.caption"),
        node: <QuestionDisplay question={sample} />,
      },
      {
        key: "answer",
        title: t("help.slides.answer.title"),
        description: t("help.slides.answer.caption"),
        node: (
          <ScorePracticeAnswerForm
            onSubmit={noop}
            disabled
            isTsumo={sample.isTsumo}
            isOya={isOya(sample.jikaze)}
          />
        ),
      },
      {
        key: "result",
        title: t("help.slides.result.title"),
        description: t("help.slides.result.caption"),
        node: (
          <View style={styles.result}>
            <ResultDisplay
              question={sample}
              userAnswer={scoreAnswerToUserAnswer(sample.answer)}
              result={HELP_TOUR_ALL_CORRECT}
            />
            <Button size="lg" fullWidth onPress={noop}>
              {t("result.next")}
            </Button>
          </View>
        ),
      },
    ];
  }, [sample, t]);

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
 * 和了形の点数計算の画面の操作（play 画面の「?」。web の `AgariScoreSpotlightTour`）
 * 和了形の点数計算の操作ヘルプ
 *
 * 盤面と回答欄の各項目に何を入れるかを 1 枚ずつ説明する。役の欄は設定で
 * 役の回答を求めるときだけ説明し、翻数と符の説明は出題設定に合わせて
 * 文言を切り替える — 設定と違う操作を案内すると、従った人が回答できなくなる。
 */
export function AgariScoreOperationHelp({
  requireYaku,
  exactHan,
  requireFuForMangan,
}: {
  readonly requireYaku: boolean;
  readonly exactHan: boolean;
  readonly requireFuForMangan: boolean;
}) {
  const t = useTranslations("agariScore.tour");
  const [isOpen, setIsOpen] = useState(false);

  const steps: readonly HelpTourStep[] = [
    {
      key: "board",
      title: t("board.title"),
      description: t("board.description"),
    },
    ...(requireYaku
      ? [
          {
            key: "yaku",
            title: t("yaku.title"),
            description: t("yaku.description"),
          },
        ]
      : []),
    {
      key: "han",
      title: t("han.title"),
      description: t(exactHan ? "han.descriptionExact" : "han.description"),
    },
    {
      key: "fu",
      title: t("fu.title"),
      description: t(
        requireFuForMangan ? "fu.descriptionRequired" : "fu.description",
      ),
    },
    {
      key: "score",
      title: t("score.title"),
      description: t("score.description"),
    },
    {
      key: "submit",
      title: t("submit.title"),
      description: t("submit.description"),
    },
    {
      key: "reveal",
      title: t("reveal.title"),
      description: t("reveal.description"),
    },
  ];

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
  result: {
    gap: 16,
  },
});

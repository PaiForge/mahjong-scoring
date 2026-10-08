import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import {
  cellKeyOf,
  listCellRefs,
} from "@mahjong-scoring/features/practice/tenpai-score/cell-ref";
import { sharedAnswerOfCells } from "@mahjong-scoring/features/practice/tenpai-score/cell-runs";
import { cellAnswerFormatters } from "@mahjong-scoring/features/practice/tenpai-score/format-cell-answer";
import { TENPAI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { BoardBleedProvider } from "../../../board/board-bleed";
import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { useJudgementHaptics } from "../../../hooks/use-judgement-haptics";
import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { useTenpaiScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { useAutoAdvanceOnCorrect } from "../../../hooks/use-training-settings-store";
import { colors, radius } from "../../../lib/theme";
import { QuestionPrompt } from "../../components/question-prompt";
import { ScoreCounter } from "../../components/score-counter";
import { CorrectFlash } from "../correct-flash";
import { EndlessFooterActions } from "../endless-footer-actions";
import { GenerationFailedNotice } from "../generation-failed-notice";
import {
  readGeneratorOptions,
  readModeFlags,
} from "../agari-score/practice-conditions";
import { ScorePracticeAnswerForm } from "../agari-score/score-practice-answer-form";
import { MachiPicker } from "./machi-picker";
import { TenpaiScoreOperationHelp } from "./tenpai-score-help";
import { TenpaiScoreResult } from "./tenpai-score-result";
import { TenpaiDisplay } from "./tenpai-display";
import { useTenpaiScoreStore } from "./use-tenpai-score-store";
import { WaitCellGrid } from "./wait-cell-grid";

/** 回答欄を出し分ける列（ツモ / ロン） */
const COLUMNS = ["tsumo", "ron"] as const;

/**
 * 聴牌形の点数計算の盤面（web の `TenpaiScoreBoard`）
 * 聴牌形練習ボード
 *
 * 1 問を「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の 3 段階で
 * 解く。段階の状態はストア（{@link useTenpaiScoreStore}）が持ち、この
 * コンポーネントは段階ごとの画面を切り替えるだけ。
 *
 * 出題条件は開いたときの設定から組む（web はクエリから読む）。web の無料枠・
 * 回答時間の計測（Pro）はモバイルに無い。web が要素を照らすツアーの代わりに、
 * 見出しの「?」からいまの段階の操作を 1 枚ずつ説明する。
 */
export function TenpaiScoreBoard() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [settings] = useState(() => useTenpaiScoreSettingsStore.getState());
  const { requireYaku, exactHan, requireFuForMangan } = readModeFlags(settings);
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const [flashSignal, setFlashSignal] = useState(0);
  const {
    currentQuestion,
    phase,
    generationFailed,
    questionSeq,
    draftSeq,
    selectedMachi,
    machiJudgement,
    selectedCells,
    cellAnswers,
    cellResults,
    stats,
    toggleMachi,
    submitMachi,
    proceedToCells,
    toggleCell,
    assignAnswer,
    submitCells,
    revealAnswer,
    generateNewQuestion,
  } = useTenpaiScoreStore();

  useJudgementHaptics(stats.correct, stats.total - stats.correct);

  // 出題条件をストアへ移し、成績と前回の問題を消してから最初の問題を作る。
  // 待ちごとに役が変わる出題なので、役の絞り込みは持たない（web と同じ）
  useEffect(() => {
    const { allowedRanges, includeParent, includeChild, includeFuro } =
      readGeneratorOptions(settings, false);
    const options = { allowedRanges, includeParent, includeChild, includeFuro };
    const store = useTenpaiScoreStore.getState();
    store.applyPracticeQuery(JSON.stringify(options), options);
    store.generateNewQuestion();
  }, [settings]);

  const scrollToTop = () =>
    scrollRef.current?.scrollTo({ y: 0, animated: false });

  const handleBackToSetup = () => router.dismissTo(TENPAI_SCORE_PRACTICE_HREF);

  const handleNext = () => {
    scrollToTop();
    generateNewQuestion();
  };

  const handleReveal = () => {
    scrollToTop();
    revealAnswer();
  };

  const handleSubmitMachi = () => {
    scrollToTop();
    submitMachi();
  };

  const handleProceed = () => {
    scrollToTop();
    proceedToCells();
  };

  // 当てはめると表の塊が組み変わり、回答欄も入れ替わる。押した位置に
  // 留まると表もボタンも画面外になるので、盤面の先頭へ戻す
  const handleAssignScore = (answer: UserAnswer) => {
    scrollToTop();
    assignAnswer({ kind: "score", answer });
  };

  const handleAssignNoYaku = () => {
    scrollToTop();
    assignAnswer({ kind: "noYaku" });
  };

  const handleSubmitCells = () => {
    scrollToTop();
    submitCells({
      requireYaku,
      exactHan,
      requireFuForMangan,
      allowDoubleYakuman,
    });
    if (autoAdvanceOnCorrect && useTenpaiScoreStore.getState().isAllCorrect) {
      setFlashSignal((prev) => prev + 1);
      generateNewQuestion();
    }
  };

  if (generationFailed) {
    return (
      <GenerationFailedNotice
        translationNamespace="tenpaiScore"
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  const renderBoard = () => {
    if (currentQuestion === undefined) return undefined;

    const isOyaQuestion = isOya(currentQuestion.jikaze);
    const { formatAnswer, formatAnswerLines } = cellAnswerFormatters({
      t: tScore,
      noYakuLabel: t("cells.noYakuShort"),
      exactHan,
      allowDoubleYakuman,
      isOya: isOyaQuestion,
    });

    const remaining = listCellRefs(currentQuestion).filter(
      (cell) => !(cellKeyOf(cell) in cellAnswers),
    ).length;
    // 選択中のマスは同じ列に限られる（ストアが保証する）ので先頭で列が決まる
    const selectedIsTsumo = selectedCells[0]?.isTsumo;
    const isSelecting = selectedIsTsumo !== undefined;
    // 選択中の回答済みマスの回答が 1 種類に定まるなら、その回答を欄に読み込む
    const sharedAnswer = sharedAnswerOfCells(selectedCells, cellAnswers);
    const prefill =
      sharedAnswer?.kind === "score" ? sharedAnswer.answer : undefined;

    return (
      <View style={styles.board}>
        {/* 裏ドラは待ちを答えるまで伏せる */}
        <TenpaiDisplay
          question={currentQuestion}
          showUraDora={phase !== "machi"}
        />

        {phase === "machi" && (
          <View style={styles.stage}>
            <QuestionPrompt
              replacement={
                machiJudgement && (
                  <Text
                    style={[
                      styles.verdict,
                      {
                        color: machiJudgement.isCorrect
                          ? colors.success
                          : colors.destructive,
                      },
                    ]}
                  >
                    {machiJudgement.isCorrect
                      ? t("machi.correct", {
                          count: machiJudgement.correct.length,
                        })
                      : t("machi.incorrect")}
                  </Text>
                )
              }
            >
              {t("machi.prompt")}
            </QuestionPrompt>

            <MachiPicker
              selected={selectedMachi}
              onToggle={toggleMachi}
              judgement={machiJudgement}
            />

            {/* 選択数の行は判定後も高さを残す（消すとボタンが上へずれる） */}
            <View style={styles.submitBlock}>
              <Text style={styles.note}>
                {machiJudgement
                  ? ""
                  : t("machi.selectedCount", { count: selectedMachi.length })}
              </Text>
              {machiJudgement ? (
                <Button size="lg" fullWidth onPress={handleProceed}>
                  {t("machi.proceed")}
                </Button>
              ) : (
                <Button
                  size="lg"
                  fullWidth
                  onPress={handleSubmitMachi}
                  disabled={selectedMachi.length === 0}
                >
                  {t("machi.submit")}
                </Button>
              )}
            </View>
          </View>
        )}

        {phase === "cells" && (
          <View style={styles.stage}>
            <QuestionPrompt>{t("cells.prompt")}</QuestionPrompt>

            <WaitCellGrid
              question={currentQuestion}
              cellAnswers={cellAnswers}
              selectedCells={selectedCells}
              formatAnswer={formatAnswer}
              onToggleCell={toggleCell}
            />

            {/* 回答欄はマスを選んだときだけ見せる。列（ツモ / ロン）ごとに 1 つ
                ずつ、1 問の間ずっと mount したまま出し入れする — 選択を解いた・
                別の列を押したの拍子に作り直すと、誤タップ 1 回で入力が失われる。
                作り直すのは当てはめたとき（draftSeq）と次の問題（questionSeq）
                だけ（web と同じ） */}
            {COLUMNS.map((column) => {
              const isTsumo = column === "tsumo";
              const isShown = selectedIsTsumo === isTsumo;
              return (
                <View
                  key={column}
                  style={[styles.formPanel, !isShown && styles.hidden]}
                >
                  <ScorePracticeAnswerForm
                    key={`${questionSeq}:${draftSeq[column]}`}
                    onSubmit={handleAssignScore}
                    isTsumo={isTsumo}
                    isOya={isOyaQuestion}
                    requireYaku={requireYaku}
                    exactHan={exactHan}
                    requireFuForMangan={requireFuForMangan}
                    submitLabel={t("cells.assign")}
                    prefill={isShown ? prefill : undefined}
                    // 「役なし」はロンにしか無い回答なので、ロンの欄にだけ出す
                    reserveYakuRow
                    noYaku={
                      isTsumo
                        ? undefined
                        : {
                            label: t("cells.noYaku"),
                            onSelect: handleAssignNoYaku,
                          }
                    }
                  />
                </View>
              );
            })}

            {/* 「回答する」はマスを選んでいる間も押させない（入力の途中で古い
                回答のまま答え合わせに進まないため）。押せない理由を注記で言う */}
            <View style={styles.submitBlock}>
              {(isSelecting || remaining > 0) && (
                <Text style={styles.note}>
                  {remaining > 0
                    ? t("cells.remaining", { count: remaining })
                    : t("cells.selecting")}
                </Text>
              )}
              <Button
                size="lg"
                fullWidth
                onPress={handleSubmitCells}
                disabled={remaining > 0 || isSelecting}
              >
                {t("cells.submit")}
              </Button>
            </View>
          </View>
        )}

        {phase === "result" && (
          <TenpaiScoreResult
            key={questionSeq}
            question={currentQuestion}
            selectedMachi={selectedMachi}
            machiJudgement={machiJudgement}
            cellAnswers={cellAnswers}
            cellResults={cellResults}
            formatAnswerLines={formatAnswerLines}
            requireYaku={requireYaku}
            exactHan={exactHan}
            requireFuForMangan={requireFuForMangan}
            onNext={handleNext}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Screen
        ref={scrollRef}
        title={t("title")}
        back
        backIcon="close"
        onBack={handleBackToSetup}
        // 段階ごとに、その画面にある要素の説明を開ける（答え合わせでは出さない）
        titleAction={
          phase === "result" ? undefined : (
            <TenpaiScoreOperationHelp phase={phase} />
          )
        }
        contentStyle={styles.content}
      >
        <BoardBleedProvider>{renderBoard()}</BoardBleedProvider>

        <ScoreCounter
          correct={stats.correct}
          incorrect={stats.total - stats.correct}
        />

        <EndlessFooterActions
          onReveal={handleReveal}
          revealDisabled={phase === "result" || currentQuestion === undefined}
          onExit={handleBackToSetup}
        />
      </Screen>
      <CorrectFlash signal={flashSignal} label={t("board.correct")} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: 32,
  },
  board: {
    gap: 24,
  },
  stage: {
    gap: 16,
  },
  verdict: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  submitBlock: {
    gap: 8,
  },
  note: {
    minHeight: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: colors.surface500,
  },
  formPanel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface50,
    padding: 16,
  },
  hidden: {
    display: "none",
  },
});

import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import { cellAnswerFormatters } from "@mahjong-scoring/features/practice/tenpai-score/format-cell-answer";
import { showsAnswerTime } from "@mahjong-scoring/features/quota/gate";
import { TENPAI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { BoardBleedProvider } from "../../../board/board-bleed";
import { Screen } from "../../../components/screen";
import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { useTenpaiScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { ScoreCounter } from "../../components/score-counter";
import { AnswerTimeBadge } from "../../quota/answer-time-badge";
import { PracticeQuotaPaywall } from "../../quota/practice-quota-paywall";
import { PracticeQuotaRemaining } from "../../quota/practice-quota-remaining";
import { CorrectFlash } from "../correct-flash";
import { EndlessFooterActions } from "../endless-footer-actions";
import { GenerationFailedNotice } from "../generation-failed-notice";
import { useEndlessBoardShell } from "../use-endless-board-shell";
import {
  readGeneratorOptions,
  readModeFlags,
} from "../agari-score/practice-conditions";
import { CellsPhase } from "./cells-phase";
import { MachiPhase } from "./machi-phase";
import { TenpaiScoreOperationHelp } from "./tenpai-score-help";
import { TenpaiScoreResult } from "./tenpai-score-result";
import { TenpaiDisplay } from "./tenpai-display";
import { useTenpaiScoreStore } from "./use-tenpai-score-store";
import { HandPresentationNotice } from "../../components/hand-presentation-notice";
import { PreparingScreenFrame } from "../../components/preparing-screen";
import { HandPresentationProvider } from "../../hand-presentation-provider";

/** 回答欄を出し分ける列（ツモ / ロン） */

/**
 * 聴牌形の点数計算の盤面（web の `TenpaiScoreBoard`）
 * 聴牌形練習ボード
 *
 * 1 問を「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の 3 段階で
 * 解く。段階の状態はストア（{@link useTenpaiScoreStore}）が持ち、この
 * コンポーネントは段階ごとの画面を切り替えるだけ。
 *
 * 出題条件は開いたときの設定から組む（web はクエリから読む）。回数制限の
 * ゲート・ペイウォール・回答時間の計測は和了形の点数計算の盤面
 * （`AgariScoreBoard`）と同じ。web が要素を照らすツアーの代わりに、
 * 見出しの「?」からいまの段階の操作を 1 枚ずつ説明する。
 */
function TenpaiScoreBoardInner() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const [settings] = useState(() => useTenpaiScoreSettingsStore.getState());
  const modeFlags = readModeFlags(settings);
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
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
  } = useTenpaiScoreStore();
  // 出題条件をストアへ移し、成績と前回の問題を消す（最初の問題の前に 1 度）。
  // 待ちごとに役が変わる出題なので、役の絞り込みは持たない（web と同じ）
  const start = useCallback(() => {
    const { allowedRanges, includeParent, includeChild, includeFuro } =
      readGeneratorOptions(settings, false);
    const options = { allowedRanges, includeParent, includeChild, includeFuro };
    const store = useTenpaiScoreStore.getState();
    store.applyPracticeQuery(JSON.stringify(options), options);
  }, [settings]);
  const {
    scrollRef,
    scrollToTop,
    flashSignal,
    autoAdvanceOnCorrect,
    gate,
    handleBackToSetup,
    handleNext,
    handleReveal,
    celebrateAndAdvance,
  } = useEndlessBoardShell({
    menu: "tenpai-score",
    exitHref: TENPAI_SCORE_PRACTICE_HREF,
    exitToast: t("exitToast"),
    stats,
    generate: () => useTenpaiScoreStore.getState().generateNewQuestion(),
    start,
    revealAnswer,
  });

  const handleSubmitCells = () => {
    submitCells({ ...modeFlags, allowDoubleYakuman });
    if (autoAdvanceOnCorrect && useTenpaiScoreStore.getState().isAllCorrect) {
      celebrateAndAdvance();
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

  // 無料枠を使い切った。問題は生成していないので盤面ごと置き換える
  if (gate?.kind === "blocked") {
    return (
      <PracticeQuotaPaywall
        menu="tenpai-score"
        translationNamespace="tenpaiScore"
        limit={gate.limit}
        signedIn={gate.signedIn}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  // 回答時間の計測（Pro の拡張機能）。設定のスイッチだけでなく、ゲートが
  // 返した特典にも含まれているときだけ出す。止めるのは答え合わせの段階
  const showAnswerTime = showsAnswerTime(settings.measureTime, gate);

  const renderBoard = () => {
    if (currentQuestion === undefined) return undefined;

    const isOyaQuestion = isOya(currentQuestion.jikaze);
    const { formatAnswer, formatAnswerLines } = cellAnswerFormatters({
      t: tScore,
      noYakuLabel: t("cells.noYakuShort"),
      exactHan: modeFlags.exactHan,
      allowDoubleYakuman,
      isOya: isOyaQuestion,
    });

    return (
      <View style={styles.board}>
        {/* 裏ドラは待ちを答えるまで伏せる */}
        <TenpaiDisplay
          question={currentQuestion}
          showUraDora={phase !== "machi"}
        />

        {phase === "machi" && (
          <MachiPhase
            selectedMachi={selectedMachi}
            machiJudgement={machiJudgement}
            scrollToTop={scrollToTop}
            onToggle={toggleMachi}
            onSubmit={submitMachi}
            onProceed={proceedToCells}
          />
        )}

        {phase === "cells" && (
          <CellsPhase
            question={currentQuestion}
            cellAnswers={cellAnswers}
            selectedCells={selectedCells}
            questionSeq={questionSeq}
            draftSeq={draftSeq}
            modeFlags={modeFlags}
            isOya={isOyaQuestion}
            formatAnswer={formatAnswer}
            scrollToTop={scrollToTop}
            onToggleCell={toggleCell}
            onAssign={assignAnswer}
            onSubmit={handleSubmitCells}
          />
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
            {...modeFlags}
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
            <TenpaiScoreOperationHelp
              phase={phase}
              requireHanFu={modeFlags.requireHanFu}
            />
          )
        }
        contentStyle={styles.content}
      >
        <BoardBleedProvider flushTop>{renderBoard()}</BoardBleedProvider>

        {/* 無料枠の残りと回答時間。どちらも無いときは何も描かない。リンクは
            待ち牌を選ぶ段階（1 問の最初）だけ */}
        {(gate?.kind === "open" || showAnswerTime) && (
          <View style={styles.quota}>
            {showAnswerTime && (
              <AnswerTimeBadge key={questionSeq} running={phase !== "result"} />
            )}
            <PracticeQuotaRemaining
              remaining={gate?.kind === "open" ? gate.remaining : undefined}
              showPlanLink={phase === "machi" && !machiJudgement}
            />
          </View>
        )}

        <HandPresentationNotice />

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
  quota: {
    gap: 4,
  },
});

/** 手牌の見せ方が決まるまでの画面（見出しと閉じるだけ） */
function TenpaiScoreBoardPreparing() {
  const t = useTranslations("tenpaiScore");
  return <PreparingScreenFrame title={t("title")} />;
}

/**
 * 手牌の見せ方を決めてから盤面を始める（無限訓練）
 *
 * 決まるまで盤面をマウントしない。出題の開始（出題条件の適用・回数制限の
 * ゲート）は盤面の effect のまま、決まった後に盤面がマウントされたときに走る。
 * スタックに残った画面へ戻るだけなら盤面も Provider もマウントされたままで、
 * 初期化も見せ方の判定もやり直さない。
 */
export function TenpaiScoreBoard() {
  return (
    <HandPresentationProvider fallback={<TenpaiScoreBoardPreparing />}>
      <TenpaiScoreBoardInner />
    </HandPresentationProvider>
  );
}

import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { isOya, type UserAnswer } from "@mahjong-scoring/core";
import { COMPREHENSIVE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { BoardBleedProvider } from "../../../board/board-bleed";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { useJudgementHaptics } from "../../../hooks/use-judgement-haptics";
import { useScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { QuestionDisplay } from "../../components/question-display";
import { QuestionPrompt } from "../../components/question-prompt";
import { ScoreCounter } from "../../components/score-counter";
import { CorrectFlash } from "../correct-flash";
import { EndlessFooterActions } from "../endless-footer-actions";
import { GenerationFailedNotice } from "../generation-failed-notice";
import { readGeneratorOptions, readModeFlags } from "./practice-conditions";
import { ResultDisplay } from "./result-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { useScorePracticeStore } from "./use-score-practice-store";

/**
 * 点数計算総合演習の盤面（web の `ScorePracticeBoard`）
 * 練習ボード
 *
 * 時計もミス上限も無く、手牌を見て役・翻・符・点数を答え、答え合わせを
 * 読んで次へ進むことを繰り返す。並びは web と同じ: 見出し → 盤面 →
 * 回答欄（回答後は面子分解・結果表・「次の問題へ」）→ 正誤カウンタ →
 * わからない / 終了する。
 *
 * 出題条件は開いたときの設定から組む（web はクエリから読む）。web の
 * 無料枠・回答時間の計測（Pro）はモバイルに無い。正解で自動で次へ進む
 * ときの知らせはトーストの代わりに {@link CorrectFlash} で出す。
 */
export function ScorePracticeBoard() {
  const t = useTranslations("score");
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  // 盤面を開いたときの設定で通す（途中で変わる経路は無いが、出題条件と
  // 判定モードを 1 問ごとに読み直さない）
  const [settings] = useState(() => useScoreSettingsStore.getState());
  const { requireYaku, simplifyMangan, requireFuForMangan, autoNext } =
    readModeFlags(settings);
  const [flashSignal, setFlashSignal] = useState(0);
  const {
    currentQuestion,
    userAnswer,
    judgementResult,
    isAnswered,
    generationFailed,
    questionSeq,
    stats,
    submitAnswer,
    revealAnswer,
    generateNewQuestion,
  } = useScorePracticeStore();

  useJudgementHaptics(stats.correct, stats.total - stats.correct);

  // 出題条件をストアへ移し、成績と前回の問題を消してから最初の問題を作る
  useEffect(() => {
    const options = readGeneratorOptions(settings, true);
    const store = useScorePracticeStore.getState();
    store.applyPracticeQuery(JSON.stringify(options), options);
    store.generateNewQuestion();
  }, [settings]);

  // 回答・開示・次へのボタンは縦に長い盤面の下端にあるので、押すたびに先頭へ戻す
  const scrollToTop = () =>
    scrollRef.current?.scrollTo({ y: 0, animated: false });

  const handleBackToSetup = () => router.dismissTo(COMPREHENSIVE_PRACTICE_HREF);

  const handleNext = () => {
    scrollToTop();
    generateNewQuestion();
  };

  const handleReveal = () => {
    scrollToTop();
    revealAnswer();
  };

  const handleSubmit = (answer: UserAnswer) => {
    scrollToTop();
    submitAnswer(answer, requireYaku, simplifyMangan, requireFuForMangan);
    if (
      autoNext &&
      useScorePracticeStore.getState().judgementResult?.isCorrect
    ) {
      setFlashSignal((prev) => prev + 1);
      generateNewQuestion();
    }
  };

  if (generationFailed) {
    return (
      <GenerationFailedNotice
        translationNamespace="score"
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  return (
    <View style={styles.root}>
      <Screen
        ref={scrollRef}
        title={t("title")}
        back
        backIcon="close"
        onBack={handleBackToSetup}
        contentStyle={styles.content}
      >
        {currentQuestion !== undefined && (
          <BoardBleedProvider>
            <View style={styles.board}>
              <QuestionDisplay question={currentQuestion} />

              {isAnswered ? (
                // 面子分解は正解開示の一部（回答中に見せると符の答えが割れる）
                <View style={styles.answered}>
                  <View style={styles.result}>
                    <TehaiMentsuBreakdown
                      tehai={currentQuestion.tehai}
                      context={currentQuestion}
                    />
                    <ResultDisplay
                      question={currentQuestion}
                      userAnswer={userAnswer}
                      result={judgementResult}
                      requireYaku={requireYaku}
                      simplifyMangan={simplifyMangan}
                      requireFuForMangan={requireFuForMangan}
                    />
                  </View>
                  <Button size="lg" fullWidth onPress={handleNext}>
                    {t("result.next")}
                  </Button>
                </View>
              ) : (
                <View style={styles.answering}>
                  <QuestionPrompt>{t("board.questionPrompt")}</QuestionPrompt>
                  <ScorePracticeAnswerForm
                    key={questionSeq}
                    onSubmit={handleSubmit}
                    isTsumo={currentQuestion.isTsumo}
                    isOya={isOya(currentQuestion.jikaze)}
                    requireYaku={requireYaku}
                    simplifyMangan={simplifyMangan}
                    requireFuForMangan={requireFuForMangan}
                  />
                </View>
              )}
            </View>
          </BoardBleedProvider>
        )}

        <ScoreCounter
          correct={stats.correct}
          incorrect={stats.total - stats.correct}
        />

        <EndlessFooterActions
          onReveal={handleReveal}
          revealDisabled={isAnswered || currentQuestion === undefined}
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
  answered: {
    gap: 24,
  },
  result: {
    gap: 16,
  },
  answering: {
    gap: 16,
  },
});

import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { isOya, type UserAnswer } from "@mahjong-scoring/core";
import { showsAnswerTime } from "@mahjong-scoring/features/quota/gate";
import { AGARI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { BoardBleedProvider } from "../../../board/board-bleed";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { showToast } from "../../../components/toast";
import { useJudgementHaptics } from "../../../hooks/use-judgement-haptics";
import { useAgariScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { useAutoAdvanceOnCorrect } from "../../../hooks/use-training-settings-store";
import { QuestionDisplay } from "../../components/question-display";
import { QuestionPrompt } from "../../components/question-prompt";
import { ScoreCounter } from "../../components/score-counter";
import { AnswerTimeBadge } from "../../quota/answer-time-badge";
import { PracticeQuotaPaywall } from "../../quota/practice-quota-paywall";
import { PracticeQuotaRemaining } from "../../quota/practice-quota-remaining";
import { usePracticeQuota } from "../../quota/use-practice-quota";
import { CorrectFlash } from "../correct-flash";
import { EndlessFooterActions } from "../endless-footer-actions";
import { GenerationFailedNotice } from "../generation-failed-notice";
import { readGeneratorOptions, readModeFlags } from "./practice-conditions";
import { ResultDisplay } from "./result-display";
import { AgariScoreOperationHelp } from "./agari-score-help";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { useAgariScoreStore } from "./use-agari-score-store";
import { HandPresentationNotice } from "../../components/hand-presentation-notice";
import { PreparingScreenFrame } from "../../components/preparing-screen";
import { HandPresentationProvider } from "../../hand-presentation-provider";

/**
 * 和了形の点数計算の盤面（web の `AgariScoreBoard`）
 * 練習ボード
 *
 * 時計もミス上限も無く、手牌を見て役・翻・符・点数を答え、答え合わせを
 * 読んで次へ進むことを繰り返す。並びは web と同じ: 見出し → 盤面 →
 * 回答欄（回答後は面子分解・結果表・「次の問題へ」）→ 正誤カウンタ →
 * わからない / 終了する。
 *
 * 出題条件は開いたときの設定から組む（web はクエリから読む）。問題は
 * 回数制限のゲート（{@link usePracticeQuota}）の許可を待ってから作り、
 * 無料枠を使い切ったら盤面の代わりにペイウォールを出す（iOS で販売中の
 * ときだけ。Android と販売していない間は無制限）。回答時間の計測（Pro）は
 * 設定のスイッチと、ゲートが返した特典の両方があるときだけ出す（web と同じ
 * 二重の判定）。正解で自動で次へ進むときの知らせはトーストの代わりに
 * {@link CorrectFlash} で出す。
 */
function AgariScoreBoardInner() {
  const t = useTranslations("agariScore");
  const tq = useTranslations("practiceQuota");
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  // 盤面を開いたときの設定で通す（途中で変わる経路は無いが、出題条件と
  // 判定モードを 1 問ごとに読み直さない）
  const [settings] = useState(() => useAgariScoreSettingsStore.getState());
  const { requireYaku, exactHan, requireFuForMangan } = readModeFlags(settings);
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
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
  } = useAgariScoreStore();
  // 問題の生成は回数制限の許可を挟む。生成そのものは今までどおり端末のストアが行う
  const { requestQuestion, requestFirstQuestion, isChecking, gate } =
    usePracticeQuota("agari-score", () =>
      useAgariScoreStore.getState().generateNewQuestion(),
    );

  useEffect(() => {
    if (gate?.kind === "rateLimited") showToast(tq("rateLimited"));
  }, [gate, tq]);

  useJudgementHaptics(stats.correct, stats.total - stats.correct);

  // 出題条件をストアへ移し、成績と前回の問題を消してから最初の問題を作る
  useEffect(() => {
    const options = readGeneratorOptions(settings, true);
    const store = useAgariScoreStore.getState();
    store.applyPracticeQuery(JSON.stringify(options), options);
    void requestFirstQuestion();
  }, [settings, requestFirstQuestion]);

  // 回答・開示・次へのボタンは縦に長い盤面の下端にあるので、押すたびに先頭へ戻す
  const scrollToTop = () =>
    scrollRef.current?.scrollTo({ y: 0, animated: false });

  // 終えたことを知らせてから設定画面へ戻す（web と同じ。文言はこの練習のもの —
  // チャレンジでもトレーニングでもないため）
  const handleBackToSetup = () => {
    router.dismissTo(AGARI_SCORE_PRACTICE_HREF);
    showToast(t("exitToast"));
  };

  const handleNext = () => {
    if (isChecking) return;
    scrollToTop();
    void requestQuestion();
  };

  const handleReveal = () => {
    scrollToTop();
    revealAnswer();
  };

  const handleSubmit = (answer: UserAnswer) => {
    scrollToTop();
    submitAnswer(answer, requireYaku, exactHan, requireFuForMangan);
    if (
      autoAdvanceOnCorrect &&
      useAgariScoreStore.getState().judgementResult?.isCorrect
    ) {
      setFlashSignal((prev) => prev + 1);
      void requestQuestion();
    }
  };

  if (generationFailed) {
    return (
      <GenerationFailedNotice
        translationNamespace="agariScore"
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  // 無料枠を使い切った。問題は生成していないので盤面ごと置き換える
  if (gate?.kind === "blocked") {
    return (
      <PracticeQuotaPaywall
        menu="agari-score"
        translationNamespace="agariScore"
        limit={gate.limit}
        signedIn={gate.signedIn}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  // 回答時間の計測（Pro の拡張機能）。設定のスイッチだけでなく、ゲートが
  // 返した特典にも含まれているときだけ出す
  const showAnswerTime = showsAnswerTime(settings.measureTime, gate);

  return (
    <View style={styles.root}>
      <Screen
        ref={scrollRef}
        title={t("title")}
        back
        backIcon="close"
        onBack={handleBackToSetup}
        // 回答中だけ、回答欄の各項目の説明を開ける（答え合わせでは出さない。web と同じ）
        titleAction={
          isAnswered ? undefined : (
            <AgariScoreOperationHelp
              requireYaku={requireYaku}
              exactHan={exactHan}
              requireFuForMangan={requireFuForMangan}
            />
          )
        }
        contentStyle={styles.content}
      >
        {currentQuestion !== undefined && (
          <BoardBleedProvider flushTop>
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
                      exactHan={exactHan}
                      requireFuForMangan={requireFuForMangan}
                    />
                  </View>
                  <Button
                    size="lg"
                    fullWidth
                    onPress={handleNext}
                    disabled={isChecking}
                  >
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
                    exactHan={exactHan}
                    requireFuForMangan={requireFuForMangan}
                  />
                </View>
              )}
            </View>
          </BoardBleedProvider>
        )}

        {/* 無料枠の残りと回答時間。どちらも無いときは何も描かない */}
        {(gate?.kind === "open" || showAnswerTime) && (
          <View style={styles.quota}>
            {showAnswerTime && (
              <AnswerTimeBadge key={questionSeq} running={!isAnswered} />
            )}
            <PracticeQuotaRemaining
              remaining={gate?.kind === "open" ? gate.remaining : undefined}
              showPlanLink={!isAnswered}
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
  quota: {
    gap: 4,
  },
});

/** 手牌の見せ方が決まるまでの画面（見出しと閉じるだけ） */
function AgariScoreBoardPreparing() {
  const t = useTranslations("agariScore");
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
export function AgariScoreBoard() {
  return (
    <HandPresentationProvider fallback={<AgariScoreBoardPreparing />}>
      <AgariScoreBoardInner />
    </HandPresentationProvider>
  );
}

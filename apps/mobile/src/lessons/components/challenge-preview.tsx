import { StyleSheet, View } from "react-native";
import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";

import { LifeIndicator } from "../../practice/components/challenge-shell";
import { QuizTimer } from "../../practice/components/quiz-timer";
import { ScoreCounter } from "../../practice/components/score-counter";
import { JantouFuBoard } from "../../practice/boards/jantou-fu/jantou-fu-board";

const noop = () => undefined;

/** プレビューで見せる途中経過。時計は 3 分の 1 ほど進み、1 回ミスしている */
const ELAPSED_SECONDS = 18;
const CORRECT_COUNT = 7;
const INCORRECT_COUNT = 1;

/**
 * チャレンジの画面のプレビュー（web の `ChallengePreview`）
 *
 * 雀頭の符計算のチャレンジを解いている途中の画面を、上端の時計とライフ・
 * 盤面・下端の正誤の数で組み直したもの。並びは `ChallengeShell` と同じだが、
 * あちらはセッションの状態を持って動くため、値を固定したこの図には使えない。
 * 一時停止と中止の操作は、プレビューでは押せないので描かない。盤面は練習の
 * 説明画面の見本（`jantouFuScreens.Demo`）と同じく、出題を引いた実物の盤面。
 */
export function ChallengePreview() {
  return (
    <View style={styles.root}>
      <View style={styles.status}>
        <QuizTimer
          timeRemaining={CHALLENGE_TIME_LIMIT - ELAPSED_SECONDS}
          progress={ELAPSED_SECONDS / CHALLENGE_TIME_LIMIT}
        />
        <LifeIndicator
          remainingLives={MISTAKE_LIMIT - INCORRECT_COUNT}
          mistakeLimit={MISTAKE_LIMIT}
        />
      </View>
      <JantouFuBoard showFeedback={false} onAnswer={noop} />
      <ScoreCounter correct={CORRECT_COUNT} incorrect={INCORRECT_COUNT} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

import { getTranslations } from "next-intl/server";
import { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "@mahjong-scoring/core";
import { LifeIndicator } from "@/app/(user)/(public)/practice/_components/challenge-shell";
import { QuizTimer } from "@/app/(user)/(public)/practice/_components/quiz-timer";
import { ScoreCounter } from "@/app/(user)/(public)/practice/_components/score-counter";
import { JantouFuHowToPlay } from "@/app/(user)/(public)/practice/jantou-fu/_components/jantou-fu-how-to-play";

/** プレビューで見せる途中経過。時計は 3 分の 1 ほど進み、1 回ミスしている */
const ELAPSED_SECONDS = 18;
const CORRECT_COUNT = 7;
const INCORRECT_COUNT = 1;

/**
 * チャレンジの画面のプレビュー
 *
 * 雀頭の符計算のチャレンジを解いている途中の画面を、上端の時計とライフ・
 * 盤面・下端の正誤の数で組み直したもの。並びは `ChallengeShell` と同じだが、
 * あちらはセッションの状態を持って動くため、値を固定したこの図には使えない。
 * 一時停止と終了の操作は、プレビューでは押せないので描かない。
 */
export async function ChallengePreview() {
  const t = await getTranslations("challenge");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <QuizTimer
          timeRemaining={CHALLENGE_TIME_LIMIT - ELAPSED_SECONDS}
          progress={ELAPSED_SECONDS / CHALLENGE_TIME_LIMIT}
        />
        <LifeIndicator
          remainingLives={MISTAKE_LIMIT - INCORRECT_COUNT}
          mistakeLimit={MISTAKE_LIMIT}
        />
      </div>
      <JantouFuHowToPlay />
      <ScoreCounter
        correct={CORRECT_COUNT}
        incorrect={INCORRECT_COUNT}
        correctLabel={t("correct")}
        incorrectLabel={t("incorrect")}
      />
    </div>
  );
}

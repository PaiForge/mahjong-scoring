import { getTranslations } from "next-intl/server";

import { fetchCompletedLessonSlugs } from "@/app/[locale]/(user)/(public)/lessons/_lib/lesson-progress";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { readDailyProblemAnswer } from "@/lib/daily-problem/answers";
import { getDailyProblem } from "@/lib/daily-problem/today";
import { logExternalError } from "@/lib/log-error";
import { selectDashboardGuidance } from "@mahjong-scoring/features/dashboard/guidance";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import type { AgariProblemPayload } from "@mahjong-scoring/core";

import { fetchAchievedRankSlugs } from "../_lib/achieved-ranks";
import { fetchAttemptedPractices } from "../_lib/attempted-practices";
import { AgariScorePracticeSection } from "./agari-score-practice-section";
import { ContinueLearningSection } from "./continue-learning-section";
import { DailyProblemSection } from "./daily-problem-section";
import { HomeAnnouncements } from "./home-announcements";
import { NextStepSection } from "./next-step-section";
import { PendingLessonSync } from "./pending-lesson-sync";

interface HomeDashboardProps {
  /** ログインしている本人の id（ページが cookie から確定したもの） */
  readonly userId: string;
  /**
   * ページの言語（`prepareRouteLocale` が確定したもの）。「次にやること」の
   * 行き先とお知らせの出し方をこの言語で決める
   */
  readonly locale: SupportedLocale;
}

/** ホームのカードに出す本日の問題と、本人の今日の解答 */
interface HomeDailyProblem {
  readonly day: string;
  readonly payload: AgariProblemPayload;
  readonly answer: DailyProblemAnswerState | undefined;
}

/**
 * 本日の問題と本人の今日の解答を読む。出せないときは undefined
 *
 * 停止中・候補が無い日は問題が無い。DB の失敗はログに残して undefined を返し、
 * カードだけを出さない — 日課の読み取りの失敗でホームごと落とさない。
 */
async function fetchHomeDailyProblem(
  userId: string,
): Promise<HomeDailyProblem | undefined> {
  try {
    const problem = await getDailyProblem(new Date());
    if (problem === undefined) return undefined;
    const answer = await readDailyProblemAnswer(userId, problem.day);
    return { day: problem.day, payload: problem.payload, answer };
  } catch (error: unknown) {
    logExternalError("HomeDashboard", "本日の問題を読めなかった", error);
    return undefined;
  }
}

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 並びは「次にやること」→「本日の問題」→（全級取得済みなら）「レッスンの続き」→
 * 「おすすめの練習」（和了形の点数計算）→ お知らせ。行程が進行中のあいだは
 * 「レッスンの続き」と「おすすめの練習」は出ず、全級取得済みなら「次にやること」が
 * 出ない。行程の出し分けは `selectDashboardGuidance` が決める。
 *
 * 「本日の問題」（{@link DailyProblemSection}）は行程とは別の軸の日課で、
 * `selectDashboardGuidance` の出し分けの外にある（出すかどうかはサーバーの値 —
 * 今日の問題があるか — だけで決まる）。主役は「次にやること」のままにし、日課は
 * その直下に置く。全級取得者の埋め草の「おすすめの練習」とは統合しない（変更を
 * 小さく保つ）。本日の問題の読み取りに失敗したらカードだけを出さず、ホームは
 * 落とさない。
 *
 * 「次にやること」は黒帯への道（段級位の行程）の中で今やること 1 つ
 * （{@link NextStepSection}）。登録直後は最初のレッスン、以降はレッスンと練習を
 * 交互に進み、最後に試験。ホームは「今すること」を答える場で、全体の道筋は
 * 道場が持つ。行程が進行中のあいだ目次は出さない — 別の「次はここ」を
 * 同じ重さで並べると今やることが決まらず、目次へはナビゲーションから行ける
 * （{@link selectDashboardGuidance}）。
 *
 * 先頭に {@link PendingLessonSync} を置く。登録前に終えたレッスンや保存に
 * 失敗した完了が端末に残っていれば、ここで本人の記録にして「次にやること」を
 * 組み直す。
 */
export async function HomeDashboard({ userId, locale }: HomeDashboardProps) {
  const [
    t,
    completedLessonSlugs,
    attemptedPractices,
    achievedRankSlugs,
    dailyProblem,
  ] = await Promise.all([
    getTranslations("nav"),
    fetchCompletedLessonSlugs(),
    fetchAttemptedPractices(),
    fetchAchievedRankSlugs(),
    fetchHomeDailyProblem(userId),
  ]);

  const { journey, nextChapter, showAgariScorePractice } =
    selectDashboardGuidance({
      completedLessonSlugs,
      attemptedPractices,
      achievedRankSlugs,
    });

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        <PendingLessonSync userId={userId} />

        <NextStepSection journey={journey} locale={locale} />

        {dailyProblem && (
          <DailyProblemSection
            day={dailyProblem.day}
            payload={dailyProblem.payload}
            answer={dailyProblem.answer}
            locale={locale}
          />
        )}

        {nextChapter && (
          <ContinueLearningSection
            completedSlugs={completedLessonSlugs}
            nextChapter={nextChapter}
          />
        )}

        {showAgariScorePractice && <AgariScorePracticeSection />}

        <HomeAnnouncements locale={locale} />
      </div>
    </ContentContainer>
  );
}

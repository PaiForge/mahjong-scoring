"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { isOya } from "@mahjong-scoring/core";
import type {
  AgariProblemPayload,
  JudgementResult,
  RuleSettings,
  UserAnswer,
} from "@mahjong-scoring/core";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import {
  buildDailyProblemQuestion,
  judgeDailyProblemAnswer,
} from "@mahjong-scoring/features/daily-problem/question";

import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { PracticeEntryQuota } from "@/app/[locale]/(user)/(public)/practice/_components/practice-entry-quota";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/[locale]/(user)/(public)/practice/_components/practice-footer-actions";
import { QuestionPrompt } from "@/app/[locale]/(user)/(public)/practice/_components/question-prompt";
import { TehaiMentsuBreakdown } from "@/app/[locale]/(user)/(public)/practice/_components/tehai-mentsu-breakdown";
import { useScrollToElement } from "@/app/[locale]/(user)/(public)/practice/_hooks/use-scroll-to-element";
import {
  PRACTICE_SCROLL_ANCHOR_ID,
  scrollToPracticeAnchor,
} from "@/app/[locale]/(user)/(public)/practice/_lib/scroll-anchor";
import { QuestionDisplay } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/question-display";
import { ResultDisplay } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/result-display";
import { ScorePracticeAnswerForm } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/score-practice-answer-form";
import { ScoreAnswerFormSkeleton } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/agari-score-board-skeleton";

import { recordDailyProblemAnswerAction } from "../_actions/record-daily-problem-answer";

/**
 * 1 回の解答。「わからない」で正解を開示したときはどちらも undefined
 * 本日の問題解答
 */
interface DailyProblemAttempt {
  readonly userAnswer?: UserAnswer;
  readonly result?: JudgementResult;
}

interface DailyProblemBoardProps {
  /** 今日（JST）の問題の盤面。閲覧者のルール設定で問題に組み立てる */
  readonly payload: AgariProblemPayload;
  /** 問題の日付（JST の `YYYY-MM-DD`）。記録の Action へそのまま送る */
  readonly day: string;
  /** ログイン済みで、今日すでに解答していればその記録（最初の解答） */
  readonly initialAnswer?: DailyProblemAnswerState;
  /** 「和了形の点数計算へ」の張る先（`resolveNavTargetFor(AGARI_SCORE_PRACTICE_HREF, locale)`） */
  readonly practiceTarget: NavTarget;
  /** 「ホームへ戻る」の張る先（`resolveNavTargetFor("/", locale)`） */
  readonly homeTarget: NavTarget;
}

/**
 * 本日の問題の盤面
 * 本日の問題盤面
 *
 * 全員に同じ和了形の点数計算 1 問を、体験ページの盤面（`TryBoard`）と同じ部品で
 * 解かせる（盤面 → 出題文 → 回答フォーム、答え合わせでは面子分解 → 結果表）。
 *
 * @design 回数制限を通さず、保存 API にも送らず、盤面はローカルの state で持つ
 * 出題の許可（`beginPracticeQuestion` / `usePracticeQuota`）を取らず、出した問題を
 * 練習の問題の保存 API（`practice-problems`）にも送らない。全員に同じ 1 問なので、
 * 何度開いても無料枠の抜け道にならない。和了形の点数計算の単一ストア
 * （`useAgariScoreStore`）も使わない — 共有すると無限訓練の成績・出題中の問題と
 * 混ざるため。解答の状態はこの部品の `useState` だけに置く。
 *
 * @design 解答済みでも同じ盤面をもう一度解ける。記録は変わらない
 * 見直しを禁じる理由が無いので、解答済み（`initialAnswer`）でも盤面はそのまま出し、
 * 上に「解答済み・記録は変わらない」とだけ添える。記録の Action は、この盤面を
 * 開いてから最初の回答または「わからない」で 1 回だけ呼ぶ（「わからない」は不正解）。
 * サーバーは最初の解答だけを残し、日付をまたいで届いた解答（前日に開いたまま
 * 今日解いたもの）は記録せず捨てる — 前日の問題を今日の解答として残さない。
 * 記録に失敗しても答え合わせは止めない（記録は「解いた」印にすぎない）。
 *
 * 問題は閲覧者のルール設定（`/preferences`。端末ローカル）で組み立て、採点も同じ
 * 設定で行う（`buildDailyProblemQuestion` / `judgeDailyProblemAnswer`）。出題する
 * 盤面はどの設定でも正解が変わらないものに絞ってある。組み立てに失敗したら
 * （保存形式と現行のルールの食い違い等）「出題できない」とだけ出す。
 *
 * 回答フォームはハイドレーション後に出す（それまで同じ形のスケルトン）。体験
 * ページと同じく、フォームの選択肢が端末ローカルのルール設定で変わり、サーバーの
 * HTML と初回のクライアント描画がずれうるため。
 *
 * 答え合わせのあとは「もっと解く」の節に、和了形の点数計算への入口と今日の残り
 * 回数（`PracticeEntryQuota`。料金のリンクは使い切ったときだけ）、ホームへ戻る
 * リンクを置く。
 */
export function DailyProblemBoard({
  payload,
  day,
  initialAnswer,
  practiceTarget,
  homeTarget,
}: DailyProblemBoardProps) {
  const t = useTranslations("dailyProblem");
  const tScore = useTranslations("agariScore");
  const tTraining = useTranslations("training");
  const tNav = useTranslations("nav");
  const isClient = useIsClient();
  // ストアの状態は RuleSettings の全項目を持つ（setter を足した形）。参照は値が
  // 変わったときだけ変わるので、そのまま組み立ての依存にする
  const settings: RuleSettings = useRuleSettingsStore();

  const built = useMemo(
    () => buildDailyProblemQuestion(payload, settings),
    [payload, settings],
  );

  const [attempt, setAttempt] = useState<DailyProblemAttempt | undefined>(
    undefined,
  );
  // 記録は開いてから最初の 1 回だけ送る。2 回目以降の解答は見直し
  const recordedRef = useRef(false);
  const isAnswered = attempt !== undefined;

  // 練習の play 画面・体験ページと同じく、開いた直後に盤面を画面最上部へ出す
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  const record = useCallback(
    (isCorrect: boolean) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      // 結果は待たない。失敗はサーバーがログに残し、答え合わせは止めない
      recordDailyProblemAnswerAction({ day, isCorrect }).catch(() => undefined);
    },
    [day],
  );

  const question = built.isOk() ? built.value : undefined;

  // 回答・開示のボタンは縦に長い盤面の下端にあるため、表示が切り替わる
  // 操作のたびに盤面の先頭へ戻す（和了形の点数計算・体験ページと同じ）
  const handleSubmit = useCallback(
    (answer: UserAnswer) => {
      if (question === undefined) return;
      scrollToPracticeAnchor();
      const result = judgeDailyProblemAnswer(question, answer, settings);
      setAttempt({ userAnswer: answer, result });
      record(result.isCorrect);
    },
    [question, settings, record],
  );

  const handleReveal = useCallback(() => {
    scrollToPracticeAnchor();
    setAttempt({});
    record(false);
  }, [record]);

  if (question === undefined) {
    return (
      <p className="text-sm leading-relaxed text-surface-500">
        {t("board.unsupported")}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {initialAnswer !== undefined && (
          <p className="text-sm leading-relaxed text-surface-500">
            {t("board.answeredNotice")}
          </p>
        )}

        <QuestionDisplay question={question} mobileFrame="fullBleedFlushTop" />

        {isAnswered ? (
          <div className="space-y-4">
            <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
            <ResultDisplay
              question={question}
              userAnswer={attempt.userAnswer}
              result={attempt.result}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <QuestionPrompt>{tScore("board.questionPrompt")}</QuestionPrompt>
            {isClient ? (
              <ScorePracticeAnswerForm
                onSubmit={handleSubmit}
                isTsumo={question.isTsumo}
                isOya={isOya(question.jikaze)}
                autoSubmit
              />
            ) : (
              <ScoreAnswerFormSkeleton />
            )}
          </div>
        )}

        {!isAnswered && (
          <PracticeFooterActions>
            <PracticeFooterAction onClick={handleReveal}>
              {tTraining("revealButton")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        )}
      </div>

      {isAnswered && (
        <>
          <section className="mt-10 space-y-4">
            <SectionTitle>{t("more.title")}</SectionTitle>
            <p className="text-sm leading-relaxed text-surface-500">
              {t("more.hint")}
            </p>
            <p>
              <LocaleNavLink
                navTarget={practiceTarget}
                linkKind="plain"
                className={`text-sm font-bold ${TEXT_LINK_CLASSES}`}
              >
                {t("more.link")}
                {practiceTarget.crossLocale && (
                  <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
                )}
              </LocaleNavLink>
            </p>
            <PracticeEntryQuota menu="agari-score" planLink="whenExhausted" />
          </section>
          <div className="mt-10 text-center">
            <LocaleNavLink
              navTarget={homeTarget}
              linkKind="plain"
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {t("more.home")}
              {homeTarget.crossLocale && (
                <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
              )}
            </LocaleNavLink>
          </div>
        </>
      )}
    </>
  );
}

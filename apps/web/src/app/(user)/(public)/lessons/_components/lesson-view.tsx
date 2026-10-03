"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { SignUpPanel } from "@/app/(user)/_components/sign-up-panel";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { ChoiceButton } from "@/app/(user)/(public)/practice/_components/choice-button";
import { FeedbackFrame } from "@/app/(user)/(public)/practice/_components/feedback-frame";
import { JudgementMark } from "@/app/(user)/(public)/practice/_components/judgement-mark";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { PromptLabel } from "@/app/(user)/(public)/practice/_components/prompt-label";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { getFeedbackStyles } from "@/app/(user)/(public)/practice/_lib/feedback-styles";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { useAuth } from "@/app/_contexts/auth-context";
import { logExternalError } from "@/lib/log-error";
import { buildSignInHref } from "@/lib/redirect";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import {
  choiceKey,
  isSameChoice,
  type LessonChoice,
  type LessonPrompt,
} from "@mahjong-scoring/features/lessons/quiz";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import type { LessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref, lessonHref } from "@mahjong-scoring/features/routes";

import { completeLesson } from "../_actions/complete-lesson";
import {
  forgetPendingLessonCompletions,
  rememberPendingLessonCompletion,
} from "../_lib/pending-completions-storage";

interface LessonViewProps {
  readonly slug: LessonSlug;
  /** レッスンの辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  /** 対応する章。未ログインの人が続きを読みに行く先 */
  readonly chapterSlug: CurriculumChapterSlug;
  /** 説明の本文（サーバーで描いたもの） */
  readonly explanation: ReactNode;
}

/** レッスンの段階 */
type Phase = "learn" | "quiz" | "done";

/**
 * 完了の保存の状態（学習の完了とは別に持つ）
 * 保存状態
 *
 * - `idle`: まだ保存していない（終える前・やり直しで戻した後）
 * - `saving`: Server Action を呼んでいる
 * - `saved`: サーバーに記録された
 * - `failed`: 通信エラー等で記録できなかった。端末に預けてあり、再試行できる
 * - `anonymous`: 未ログインで終えた。端末に預けてあり、登録後のホームが記録する
 * - `signedOut`: ログイン済みのつもりだったがサーバーではセッションが無かった。
 *   端末に本人の id 付きで預けてあり、ログインし直すとホームが記録する
 */
type SaveState =
  "idle" | "saving" | "saved" | "failed" | "anonymous" | "signedOut";

/** 点数を日本語ロケールの桁区切りで表示する */
function formatPoints(points: number): string {
  return points.toLocaleString("ja-JP");
}

/** 翻訳関数（`useTranslations` の戻り値のうち、ここで使う形） */
type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * 選択肢のボタンに出す文字列
 *
 * 数字だけで読めるもの（点数・子のツモの支払い）は辞書を通さずに組む。
 * 単位や語が付くもの（オール・翻・役満）は辞書から引く。
 */
function choiceLabel(choice: LessonChoice, t: Translator): string {
  switch (choice.kind) {
    case "points":
      return formatPoints(choice.points);
    case "koTsumo":
      return `${formatPoints(choice.fromKo)} / ${formatPoints(choice.fromOya)}`;
    case "oyaTsumo":
      return t("choiceLabels.oyaTsumo", { all: formatPoints(choice.all) });
    case "han":
      return t("choiceLabels.han", { han: choice.han });
    case "yakuman":
      return t("choiceLabels.yakuman");
  }
}

/**
 * 不正解のときに「正解は〜」へ差し込む文字列
 *
 * ボタンでは単位を省いている点数・子のツモにだけ「点」を付ける。
 */
function answerLabel(choice: LessonChoice, t: Translator): string {
  switch (choice.kind) {
    case "points":
    case "koTsumo":
      return t("answerLabels.points", { points: choiceLabel(choice, t) });
    default:
      return choiceLabel(choice, t);
  }
}

/** 条件文（辞書の `condition`）へ差し込む値 */
function conditionValues(
  prompt: LessonPrompt,
  tScoreTable: (key: string) => string,
): Record<string, string | number> {
  switch (prompt.kind) {
    case "tier":
      return { han: prompt.han, tier: tScoreTable(prompt.tierKey) };
    case "yaku":
      return { yaku: prompt.yaku, state: prompt.naki ? "naki" : "menzen" };
  }
}

/**
 * レッスンの進行（説明 → 確認問題 → できたことの確認）
 * レッスン進行
 *
 * 確認問題はチャレンジの盤面と同じ部品（選択肢ボタン・正誤の枠・出題文）で
 * 描くが、時計もライフも無い。間違えても止まらず、正解と解説を見せてから
 * 次へ進む。練習と違って「何問正解したか」は結果に残さない — 最後に
 * 出すのは覚えた内容で、正答数はその場で添えるだけ。
 *
 * @design 学習の完了と保存は別の状態
 * 最後の問題を解いた時点で学習は終わり（`phase: "done"`）、保存はそこから
 * 始まる（{@link SaveState}）。保存が済んだと言えるのは Server Action が
 * 成功を返したときだけで、呼んだ時点で済みにはしない。失敗したら完了画面の
 * 中で解き直さずに再試行でき、どの失敗でも完了を端末に預ける
 * （`pending-completions-storage`）ので、「次の一歩へ」でホームに進んでも
 * ホームが同期を再試行し、進捗が黙って消えることはない。保存中は「次の一歩へ」
 * を押せなくする。やり直して解き終えても、保存済みなら二重には送らない
 * （サーバー側も冪等）。
 *
 * @design ログインしているかはサーバーが決める
 * 認証状態をクライアントで先読みして保存を分岐しない（練習の保存
 * `useSaveOnFinish` と同じ理由 — 認証コンテキストの初期ロード中に終えた
 * 場合に、ログイン済みが匿名扱いされる競合を 2 度起こしている）。終えたら
 * 必ず Server Action を呼び、未ログインは `skipped: "anonymous"` の戻りで
 * 知る。そのとき完了は端末に預け、登録して最初にホームを開いたときに本人の
 * 記録になる（引き継げる条件は features の `pending-completions` 参照）。
 * クライアント側の `user` は、`skipped` が「未ログイン」か「セッション切れ」
 * かを言い分けるためと、預かりに本人の id を付けるためにだけ使う。
 *
 * 問題と選択肢は slug から features の `lessonQuiz` で引き、条件文・
 * ヒント・解説・達成の文言はレッスンの辞書（`lessons.<messageKey>`）から引く。
 * 進行はレッスンの種類で分岐させない。
 */
export function LessonView({
  slug,
  messageKey,
  chapterSlug,
  explanation,
}: LessonViewProps) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const tScoreTable = useTranslations("scoreTable");
  const { user } = useAuth();

  const { questions, choices } = lessonQuiz(slug);

  const [phase, setPhase] = useState<Phase>("learn");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LessonChoice | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // 再試行ボタンの連打を止める。state だけだと更新が反映される前に
  // 2 回目が走り得る
  const inFlight = useRef(false);

  const question = questions[index];
  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && isSameChoice(selected, question.answer);
  const isLast = index === questions.length - 1;

  /**
   * 完了をサーバーへ記録する。`userId` はクライアントが知っている本人の id
   * （未ログインに見えていれば undefined）で、誰の記録にするかには使わない
   */
  const save = useCallback(
    async (userId: string | undefined) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaveState("saving");
      try {
        const result = await completeLesson(slug);
        if (!result.success) {
          // レジストリに無い slug。静的生成されたページでは起きないが、
          // 起きたら失敗として見せる（預けても同期で捨てられるだけ）
          logExternalError("completeLesson", slug, result.error);
          setSaveState("failed");
          return;
        }
        if ("skipped" in result) {
          // サーバーにセッションが無い。未ログインなら持ち主なしで預けて
          // 登録後に引き継ぐ。クライアントではログイン済みに見えていたなら
          // セッション切れなので、本人の id を付けて預け、ログインし直した
          // ホームで記録する
          rememberPendingLessonCompletion(slug, userId);
          setSaveState(userId === undefined ? "anonymous" : "signedOut");
          return;
        }
        // 以前の失敗で預けた分があれば、記録できたので外す
        forgetPendingLessonCompletions([slug]);
        setSaveState("saved");
      } catch (error: unknown) {
        logExternalError("completeLesson", slug, error);
        rememberPendingLessonCompletion(slug, userId);
        // 未ログインなら記録するものは元々無く、預けた完了は登録後に引き継ぐ。
        // 失敗の注記ではなく登録への誘導を出す
        setSaveState(userId === undefined ? "anonymous" : "failed");
      } finally {
        inFlight.current = false;
      }
    },
    [slug],
  );

  const handleSelect = (choiceIndex: number) => {
    if (isAnswered) return;
    const choice = choices[choiceIndex];
    setSelected(choice);
    if (isSameChoice(choice, question.answer)) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setPhase("done");
      // 記録済みなら送り直さない（やり直して解き終えたとき）
      if (saveState !== "saved") void save(user?.id);
      return;
    }
    setIndex(index + 1);
    setSelected(undefined);
    setShowHint(false);
  };

  const handleRetry = () => {
    setPhase("learn");
    setIndex(0);
    setSelected(undefined);
    setShowHint(false);
    setCorrectCount(0);
    // 保存の状態はそのまま持ち越す。記録済みなら解き終えても送り直さず、
    // 記録できていない状態（失敗・未ログイン）なら解き終えたときにもう一度
    // 記録を試みる（`handleNext`）
  };

  const handleRetrySave = () => {
    void save(user?.id);
  };

  if (phase === "learn") {
    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <SectionTitle>{t("learnTitle")}</SectionTitle>
          {explanation}
        </section>
        <Button size="lg" fullWidth onClick={() => setPhase("quiz")}>
          {t("startQuiz", { count: questions.length })}
        </Button>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t("quizTitle")}</SectionTitle>
            <span className="text-sm font-bold tabular-nums text-surface-600">
              {t("progress", { index: index + 1, total: questions.length })}
            </span>
          </div>

          <FeedbackFrame
            showFeedback={isAnswered}
            lastAnswerCorrect={isAnswered ? isCorrect : undefined}
            className="space-y-3 p-6 text-center"
          >
            <PromptLabel>{t("conditionLabel")}</PromptLabel>
            <p
              className="text-xl font-bold text-surface-900"
              data-testid="lesson-condition"
            >
              {tLesson(
                "condition",
                conditionValues(question.prompt, tScoreTable),
              )}
            </p>
            {/* ヒントは選択肢に手を付ける前に見られる。答えそのものではなく
                倍率の言い方で、表を思い出す手がかりにする */}
            {showHint && !isAnswered && (
              <p className="text-sm text-amber-900" data-testid="lesson-hint">
                <span className="font-bold">{t("hintLabel")}: </span>
                {tLesson(`questions.${question.key}.hint`)}
              </p>
            )}
            {isAnswered && (
              <p
                className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isCorrect ? "text-success-strong" : "text-destructive-strong"}`}
                data-testid="lesson-judgement"
              >
                <JudgementMark
                  verdict={isCorrect ? "correct" : "incorrect"}
                  tone="inherit"
                />
                {isCorrect
                  ? t("correct")
                  : t("incorrect", { answer: answerLabel(question.answer, t) })}
              </p>
            )}
            {isAnswered && (
              <p className="text-sm leading-relaxed text-surface-700">
                {tLesson(`questions.${question.key}.explanation`)}
              </p>
            )}
          </FeedbackFrame>

          <QuestionPrompt>{tLesson("questionPrompt")}</QuestionPrompt>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {choices.map((choice, choiceIndex) => {
              const { borderClass, bgClass } = getFeedbackStyles(
                isAnswered,
                selected !== undefined && isSameChoice(selected, choice),
                isSameChoice(choice, question.answer),
              );
              return (
                <ChoiceButton
                  key={choiceKey(choice)}
                  index={choiceIndex}
                  onSelect={handleSelect}
                  disabled={isAnswered}
                  borderClass={borderClass}
                  bgClass={bgClass}
                  className="text-lg font-bold tabular-nums"
                >
                  {choiceLabel(choice, t)}
                </ChoiceButton>
              );
            })}
          </div>
        </section>

        {isAnswered ? (
          <Button size="lg" fullWidth onClick={handleNext}>
            {isLast ? t("finish") : t("next")}
          </Button>
        ) : (
          <PracticeFooterActions>
            <PracticeFooterAction
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              {t("showHint")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionTitle>{t("doneTitle")}</SectionTitle>
        <HighlightPanel>
          <p className="text-base font-bold leading-relaxed text-surface-900">
            {tLesson("achievement")}
          </p>
          <p
            className="mt-2 text-sm text-surface-700"
            data-testid="lesson-score"
          >
            {correctCount === questions.length
              ? t("doneScorePerfect", { total: questions.length })
              : t("doneScore", {
                  correct: correctCount,
                  total: questions.length,
                })}
          </p>
        </HighlightPanel>
      </section>

      <CompletionActions
        saveState={saveState}
        chapterSlug={chapterSlug}
        signInHref={buildSignInHref(lessonHref(slug))}
        onRetrySave={handleRetrySave}
      />

      <PracticeFooterActions>
        <PracticeFooterAction onClick={handleRetry}>
          {t("retry")}
        </PracticeFooterAction>
      </PracticeFooterActions>
    </div>
  );
}

interface CompletionActionsProps {
  readonly saveState: SaveState;
  readonly chapterSlug: CurriculumChapterSlug;
  readonly signInHref: string;
  readonly onRetrySave: () => void;
}

/**
 * 完了画面の導線。保存の状態ごとに「次の一歩へ」の出し方を変える
 * 完了後の導線
 *
 * - 保存中: ボタンを押せなくして記録中と示す（押せると記録される前に離れる）
 * - 保存済み: ホーム（次の一歩）へ
 * - 失敗: 何が起きたかと、ホームに進んでも後で記録されることを伝え、
 *   その場での再試行を主導線にする。ホームへは補助リンクで行ける
 * - 未ログイン: 登録への誘導（今の完了も引き継がれると添える）
 * - セッション切れ: ログインし直す導線
 */
function CompletionActions({
  saveState,
  chapterSlug,
  signInHref,
  onRetrySave,
}: CompletionActionsProps) {
  const t = useTranslations("lessons");

  switch (saveState) {
    case "idle":
    case "saving":
      return (
        <Button size="lg" fullWidth disabled data-testid="lesson-saving">
          {t("saving")}
        </Button>
      );
    case "saved":
      return (
        <LinkButton
          href="/"
          size="lg"
          fullWidth
          trailingIcon={<ChevronRightIcon className="size-5" />}
        >
          {t("continueHome")}
        </LinkButton>
      );
    case "failed":
      return (
        <div
          role="alert"
          data-testid="lesson-save-failed"
          className="space-y-4 rounded-lg border-3 border-destructive bg-destructive-subtle p-5"
        >
          <p className="text-base font-bold text-destructive-strong">
            {t("saveFailed.title")}
          </p>
          <p className="text-sm leading-relaxed text-surface-700">
            {t("saveFailed.description")}
          </p>
          <div className={`flex flex-col ${SUB_LINK_GAP}`}>
            <Button size="lg" fullWidth onClick={onRetrySave}>
              {t("saveFailed.retry")}
            </Button>
            <div className="text-center">
              <Link href="/" className={`text-sm ${TEXT_LINK_CLASSES}`}>
                {t("saveFailed.goHome")}
              </Link>
            </div>
          </div>
        </div>
      );
    case "signedOut":
      return (
        <div
          role="alert"
          data-testid="lesson-signed-out"
          className="space-y-4 rounded-lg border-3 border-ink bg-surface-50 p-5 text-center"
        >
          <p className="text-sm leading-relaxed text-surface-700">
            {t("signedOut.description")}
          </p>
          <LinkButton href={signInHref} size="lg" fullWidth>
            {t("signedOut.signIn")}
          </LinkButton>
        </div>
      );
    case "anonymous":
      return (
        <SignUpPanel
          title={t("signUp.title")}
          description={t("signUp.description")}
          cta={t("signUp.cta")}
          secondary={{
            label: t("signUp.secondary"),
            href: chapterHref(chapterSlug),
          }}
        />
      );
  }
}

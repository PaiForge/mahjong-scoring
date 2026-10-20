"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { DoneMark } from "@/app/(user)/_components/done-mark";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { SignUpPanel } from "@/app/(user)/_components/sign-up-panel";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { JudgementMark } from "@/app/(user)/(public)/practice/_components/judgement-mark";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { scrollToAnchor } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { useAuth } from "@/app/_contexts/auth-context";
import { logExternalError } from "@/lib/log-error";
import { buildSignInHref } from "@/lib/redirect";
import type { JourneyStep } from "@mahjong-scoring/features/journey/journey";
import {
  isSameChoice,
  type LessonChoice,
} from "@mahjong-scoring/features/lessons/quiz";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import { completeLesson } from "../_actions/complete-lesson";
import type { LessonFollowUp } from "@mahjong-scoring/features/lessons/follow-up";
import { useLessonCompletion } from "../_hooks/use-lesson-completion";
import { usePhaseHistory } from "../_hooks/use-phase-history";
import { LESSON_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { LessonFollowUpProvider } from "./lesson-follow-up-context";
import { LessonQuestionCard } from "./lesson-question-card";
import { LessonQuizSteps } from "./lesson-quiz-steps";
import {
  forgetPendingLessonCompletions,
  rememberPendingLessonCompletion,
} from "../_lib/pending-completions-storage";

interface LessonViewProps {
  readonly slug: QuizLessonSlug;
  /** 確認問題の辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  /**
   * 完了を記録できたあとの主導線。黒帯への道でこのレッスンの次にある一歩
   * （次のレッスン・練習・昇級試験）で、文言はその一歩を名指しする。
   * `preview` があればボタンの代わりにそれを出す（次がレッスンのときの
   * 冒頭のプレビュー。サーバーで描いたもの。`previewLessonSlug` がその
   * レッスン）。`goal` はボタンの下に添える（後ろにレッスンが無いときの
   * 「昇級試験まで」。サーバーで描いたもの）
   *
   * これは道筋の順の一歩で、記録のときにサーバーが本人の進み具合を踏まえた
   * 一歩を返したらそちらを使う（{@link CompletionActions}）
   */
  readonly next: {
    readonly href: string;
    readonly label: string;
    readonly preview?: ReactNode;
    readonly previewLessonSlug?: QuizLessonSlug;
    readonly goal?: ReactNode;
  };
  /** 本文（章の本文そのもの。見出しを含む。サーバーで描いたもの） */
  readonly explanation: ReactNode;
  /**
   * 練習・昇級試験への導線と広告（サーバーで描いたもの）。完了画面の末尾と、
   * 完了済みの人が開いた本文の下に出す。確認問題より前には出さない
   */
  readonly related?: ReactNode;
  /**
   * 章の末尾（前後のレッスンへのナビ・公開日・広告。サーバーで描いたもの）。
   * 本文の画面と完了画面の最後に出す。確認問題の画面には出さない —
   * 解いている途中に別の章へ逸れる導線を置かない
   */
  readonly footer?: ReactNode;
}

/** 記録の結果で受け取った続き。誰の分かを持ち、ユーザーが切り替わったら捨てる */
interface FetchedFollowUp {
  readonly userId: string;
  readonly followUp: LessonFollowUp;
}

/** レッスンの段階（並びは進む順） */
const PHASES = ["learn", "quiz", "done"] as const;

/**
 * 完了の保存の状態（学習の完了とは別に持つ）
 * 保存状態
 *
 * - `idle`: まだ保存していない（終える前）
 * - `saving`: Server Action を呼んでいる
 * - `saved`: サーバーに記録された
 * - `failed`: 通信エラー等で記録できなかった。端末に預けてあり、再試行できる
 * - `anonymous`: 未ログインで終えた。端末に預けてあり、登録後のホームが記録する
 * - `signedOut`: ログイン済みのつもりだったがサーバーではセッションが無かった。
 *   端末に本人の id 付きで預けてあり、ログインし直すとホームが記録する
 */
type SaveState =
  "idle" | "saving" | "saved" | "failed" | "anonymous" | "signedOut";

/**
 * レッスンの進行（本文 → 確認問題 → できたことの確認）
 * レッスン進行
 *
 * 確認問題を持つレッスンの章ページ（`LearnPageLayout`）が、章の本文を
 * `explanation` として渡して描く。本文の段階では本文そのものが見え、確認問題と
 * 完了画面は本文と入れ替わる（URL は変わらない）。
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
 * （`pending-completions-storage`）ので、補助リンクでホームに進んでも
 * ホームが同期を再試行し、進捗が黙って消えることはない。保存中は次の一歩の
 * を押せなくする。サーバー側も冪等なので、再試行で二重に記録されることはない。
 *
 * 完了画面に「もう一度やる」は置かない。解き直したい人はページを開き直せば
 * よく、完了画面の導線は次の一歩・練習・昇級試験へ向ける。
 *
 * 完了済みの人が開いたときは、本文の下の「確認問題へ」のボタンを控えめな
 * 解き直しのリンクに替え、その下に完了画面と同じ練習・試験への導線を出す。
 * 戻ってくる目的は表の見直しか練習を探すことで、確認問題ではないため。
 * 次のレッスンへの導線は出さない — 道筋の続きはホームの「次にやること」が
 * 進み具合を踏まえて示す。
 * 完了済みかはページを開いてから取る（静的ページのため）ので、取れるまでは
 * 未完了と同じく「確認問題へ」を出す。
 *
 * @design 段階はブラウザの履歴に積む
 * 段階を進めるたびに履歴へ 1 項目積み（{@link usePhaseHistory}）、「戻る」で
 * 1 段階ずつ戻れるようにする。完了画面から戻ると最後の問題を答えた状態、
 * 確認問題から戻ると本文で、本文の下のボタンは「確認問題に戻る（n / m 問目）」
 * になり、途中の問題（選んだ答え・ヒント・正答数ごと）から続ける。
 * 確認問題の下と完了画面の次の一歩の下の「本文を読み返す」も同じで、本文の段階を履歴に積んで
 * 本文の先頭へ送る（読み返してからの「戻る」は解いていた問題へ戻る）。
 * 表を見返したくなるたびに最初から解き直させないため。解き終えたあとに
 * 本文まで戻って押したときだけ最初から解き直す（完了は記録済みなので、
 * もう一度は記録しない）。
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
 * ヒント・解説・達成の文言は確認問題の辞書（`lessons.<messageKey>`）から引く。
 * 進行はレッスンの種類で分岐させない。
 */
export function LessonView({
  slug,
  messageKey,
  next,
  explanation,
  related,
  footer,
}: LessonViewProps) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const { user } = useAuth();
  const { completed, markCompleted } = useLessonCompletion(slug);

  const { questions, choices } = lessonQuiz(slug);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LessonChoice | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  // 確認問題を解いている途中か（本文を読み返しても続きから戻れるように）。
  // 解き終えた時点で外す — 完了は `finished`（保存の状態）が持ち、こちらは
  // 解き直しの途中も表す
  const [inQuiz, setInQuiz] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // 記録のときにサーバーが返した本人の続き（次の一歩・級の進み具合）
  const [fetchedFollowUp, setFetchedFollowUp] = useState<
    FetchedFollowUp | undefined
  >(undefined);
  // 別のユーザーの分は使わない（開いたままログアウト・別アカウントでログイン
  // した場合）。済みの印（`useLessonCompletion`）と同じ扱い
  const followUp =
    fetchedFollowUp !== undefined && fetchedFollowUp.userId === user?.id
      ? fetchedFollowUp.followUp
      : undefined;
  // 保存を始めた = 解き終えた。完了画面はそのあとでしか描けない
  const finished = saveState !== "idle";
  const [phase, pushPhase] = usePhaseHistory(
    PHASES,
    (target) => target !== "done" || finished,
    LESSON_SCROLL_ANCHOR_ID,
  );
  // 再試行ボタンの連打を止める。state だけだと更新が反映される前に
  // 2 回目が走り得る
  const inFlight = useRef(false);

  const question = questions[index];
  const isAnswered = selected !== undefined;
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
        if ("error" in result) {
          // レジストリに無い slug（静的生成されたページでは起きない）か BAN。
          // どちらも失敗として見せ、預けない（同期しても捨てられるか
          // 弾かれるだけ）
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
        // 誰の分か分からない（クライアントが本人を知らないまま記録できた）
        // ときは持たない。完了画面は道筋の順の一歩を出す
        if (userId !== undefined && result.followUp !== undefined) {
          setFetchedFollowUp({ userId, followUp: result.followUp });
        }
        setSaveState("saved");
        markCompleted();
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
    [slug, markCompleted],
  );

  const handleSelect = (choiceIndex: number) => {
    if (isAnswered) return;
    const choice = choices[choiceIndex];
    setSelected(choice);
    if (isSameChoice(choice, question.answer)) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleStart = () => {
    // 解き終えたあとに本文まで戻ってきたら最初から。途中なら続きから
    if (!inQuiz) {
      setIndex(0);
      setSelected(undefined);
      setShowHint(false);
      setCorrectCount(0);
      setInQuiz(true);
    }
    pushPhase("quiz");
  };

  const handleReviewBody = () => {
    // 履歴に本文の段階を積む。読み返した後の「戻る」は解いていた問題へ戻る
    pushPhase("learn");
  };

  const handleNext = () => {
    if (isLast) {
      setInQuiz(false);
      pushPhase("done");
      // 完了画面から戻って押し直したときは、もう記録を始めている
      if (!finished) void save(user?.id);
      return;
    }
    setIndex(index + 1);
    setSelected(undefined);
    setShowHint(false);
    // 「次へ」は解説の下にあり、押した位置のままだと次の問題が画面外に残る
    scrollToAnchor(LESSON_SCROLL_ANCHOR_ID);
  };

  const handleRetrySave = () => {
    void save(user?.id);
  };

  if (phase === "learn") {
    return (
      <div className="relative space-y-8">
        {/* 完了済みの印はカードの右上（本文の最初の見出しの行の右端）。
            見出しの「?」とは場所を分ける。確認問題の画面には頭に進み具合の
            ステップが、完了画面には達成の表示があるので本文の画面だけ */}
        {completed && (
          <div className="absolute right-0 top-1.5">
            <DoneMark label={t("completedMark")} />
          </div>
        )}
        {explanation}
        {inQuiz ? (
          <Button size="lg" fullWidth onClick={handleStart}>
            {t("resumeQuiz", { index: index + 1, total: questions.length })}
          </Button>
        ) : completed ? (
          <>
            {/* 完了済みの人に確認問題を主導線として勧めない。解き直しは
                移動と同じ控えめなリンクにして、練習・試験へ送る */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleStart}
                className={`text-sm ${TEXT_LINK_CLASSES}`}
              >
                {t("retakeQuiz")}
              </button>
            </div>
            {related}
          </>
        ) : (
          <Button size="lg" fullWidth onClick={handleStart}>
            {t("startQuiz", { count: questions.length })}
          </Button>
        )}
        {footer}
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <SectionTitle>{t("quizTitle")}</SectionTitle>
          <LessonQuizSteps
            current={index}
            total={questions.length}
            label={t("progress", { index: index + 1, total: questions.length })}
          />

          <LessonQuestionCard
            messageKey={messageKey}
            question={question}
            choices={choices}
            selected={selected}
            showHint={showHint}
            onSelect={handleSelect}
          />
        </section>

        <div className={`flex flex-col ${SUB_LINK_GAP}`}>
          {isAnswered && (
            <Button size="lg" fullWidth onClick={handleNext}>
              {isLast ? t("finish") : t("next")}
            </Button>
          )}
          <PracticeFooterActions>
            {!isAnswered && (
              <PracticeFooterAction
                onClick={() => setShowHint(true)}
                disabled={showHint}
              >
                {t("showHint")}
              </PracticeFooterAction>
            )}
            <PracticeFooterAction onClick={handleReviewBody}>
              {t("reviewBody")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        </div>
      </div>
    );
  }

  const perfect = correctCount === questions.length;

  return (
    <LessonFollowUpProvider value={followUp}>
      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitle>
            {perfect ? t("doneTitle") : t("doneTitleReview")}
          </SectionTitle>
          {perfect ? (
            // 合格（昇級試験の結果）と同じ success の囲み。レッスンの完了は
            // 小さな合格で、確認問題の正解の ✓ と同じ記号・同じ色で「できた」を
            // 示す。琥珀色（HighlightPanel）は教本のコラム・注意書きの記号なので
            // 使わない — 補足に見える
            <div
              className="rounded-panel border border-success bg-success-subtle p-5 text-success-strong"
              data-testid="lesson-achievement"
            >
              <p className="flex items-start gap-2 text-base font-bold leading-relaxed">
                <JudgementMark verdict="correct" tone="inherit" />
                <span>{tLesson("achievement")}</span>
              </p>
            </div>
          ) : (
            // 間違えた問題があるときは「できるようになった」と言わない。正答数と
            // 見直しの案内を中立の囲みで出し、本文へ戻る導線をここに置く。
            // 全問正解のときは正答数を出さない — 緑の囲みが「できた」を示す
            // 完了の記録と次の一歩は全問正解と同じ — 完了は「取り組んだ」印で、
            // 習得の判定は昇級試験が持つ。同じ 3 問を解き直させても答えを
            // 覚えるだけなので、全問正解を完了の条件にはしない
            <div
              className="space-y-3 rounded-panel border border-panel bg-surface-50 p-5"
              data-testid="lesson-review"
            >
              <p
                className="text-base font-bold text-surface-900"
                data-testid="lesson-score"
              >
                {t("doneScore", {
                  correct: correctCount,
                  total: questions.length,
                })}
              </p>
              <p className="text-sm leading-relaxed text-surface-700">
                {t("doneReviewAdvice")}
              </p>
              <Button
                variant="neutral"
                fullWidth
                onClick={handleReviewBody}
                data-testid="lesson-done-review-body"
              >
                {t("reviewBody")}
              </Button>
            </div>
          )}
          {/* 次の一歩は結果の続きとして同じ節に置く。節を分けると結果と
            次の一歩の間に見出しの区切りが入る */}
          <div className={`flex flex-col ${SUB_LINK_GAP}`}>
            <CompletionActions
              saveState={saveState}
              next={next}
              progressStep={followUp?.next}
              signInHref={buildSignInHref(chapterHref(slug))}
              onRetrySave={handleRetrySave}
            />
            {/* 全問正解でも表を見返したい人へ。次の一歩の下に移動だけの
                リンクで置き、主導線（次の一歩）とは押し間違えない間隔を取る。
                戻った本文は完了済みの形（解き直しのリンクと練習・試験）になる。
                間違えたときは結果の囲みの中に置くので出さない */}
            {perfect && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleReviewBody}
                  className={`text-sm ${TEXT_LINK_CLASSES}`}
                  data-testid="lesson-done-review-body"
                >
                  {t("reviewBody")}
                </button>
              </div>
            )}
          </div>
        </section>

        {related}
        {footer}
      </div>
    </LessonFollowUpProvider>
  );
}

interface CompletionActionsProps {
  readonly saveState: SaveState;
  readonly next: LessonViewProps["next"];
  /** 本人の進み具合を踏まえた次の一歩。あれば `next` より優先する */
  readonly progressStep: JourneyStep | undefined;
  readonly signInHref: string;
  readonly onRetrySave: () => void;
}

/**
 * 完了画面の導線。保存の状態ごとに次の一歩のボタンの出し方を変える
 * 完了後の導線
 *
 * - 保存中: ボタンを押せなくして記録中と示す（押せると記録される前に離れる）
 * - 保存済み: 黒帯への道でこのレッスンの次にある一歩へ。次がレッスンなら
 *   その冒頭のプレビューと「続きを読む」、それ以外はボタン（ホームを経由せず、
 *   行き先を名指しした文言で直接送る。緑のボタンが「押して始める」の記号
 *   なので、行き先の分からない「次の一歩へ」でホームに戻すのは避ける）。
 *   後ろにレッスンが無ければ、ボタンの下に「昇級試験まで」を添える。
 *   行き先は記録のときにサーバーが返した本人の一歩（済ませた先の項目を
 *   指さない。選び方は features の `stepAfterLessonWithProgress`）で、
 *   返らなければ道筋の順の一歩。
 *   プレビューはサーバーで描いた道筋の順の次のレッスンの分しか無いので、
 *   本人の一歩が別の所を指すときはボタンで送る
 * - 失敗: 何が起きたかと、ホームに進んでも後で記録されることを伝え、
 *   その場での再試行を主導線にする。ホームへは補助リンクで行ける
 * - 未ログイン: 登録への誘導（今の完了も引き継がれると添える）。補助リンクは
 *   登録せずに道筋の順の次の一歩へ進む
 * - セッション切れ: ログインし直す導線
 */
function CompletionActions({
  saveState,
  next,
  progressStep,
  signInHref,
  onRetrySave,
}: CompletionActionsProps) {
  const t = useTranslations("lessons");
  const tAll = useTranslations();

  switch (saveState) {
    case "idle":
    case "saving":
      return (
        <Button size="lg" fullWidth disabled data-testid="lesson-saving">
          {t("saving")}
        </Button>
      );
    case "saved": {
      const usePlanned =
        progressStep === undefined ||
        (progressStep.kind === "lesson" &&
          progressStep.chapterSlug === next.previewLessonSlug);
      if (usePlanned && next.preview !== undefined) return next.preview;
      return (
        <>
          <LinkButton
            href={usePlanned ? next.href : journeyStepHref(progressStep)}
            size="lg"
            fullWidth
            trailingIcon={<ChevronRightIcon className="size-5" />}
          >
            {usePlanned
              ? next.label
              : t(`nextStep.${progressStep.kind}`, {
                  title: journeyStepTitle(progressStep, tAll),
                })}
          </LinkButton>
          {next.goal}
        </>
      );
    }
    case "failed":
      return (
        <div
          role="alert"
          data-testid="lesson-save-failed"
          className="space-y-4 rounded-panel border border-destructive bg-destructive-subtle p-5"
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
          className="space-y-4 rounded-panel border border-panel bg-surface-50 p-5 text-center"
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
          secondary={{ label: t("signUp.secondary"), href: next.href }}
        />
      );
    default: {
      const exhaustive: never = saveState;
      return exhaustive;
    }
  }
}

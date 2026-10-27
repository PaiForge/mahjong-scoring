"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { scrollToAnchor } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { useAuth } from "@/app/_contexts/auth-context";
import { logExternalError } from "@/lib/log-error";
import { buildSignInHref } from "@/lib/redirect";
import {
  isSameChoice,
  type LessonChoice,
} from "@mahjong-scoring/features/lessons/quiz";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { completeLesson } from "../_actions/complete-lesson";
import type { LessonFollowUp } from "@mahjong-scoring/features/lessons/follow-up";
import { useLessonCompletion } from "../_hooks/use-lesson-completion";
import { usePhaseHistory } from "../_hooks/use-phase-history";
import { LESSON_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { LessonFollowUpProvider } from "./lesson-follow-up-context";
import {
  LessonDonePhase,
  type LessonNextLink,
  type SaveState,
} from "./lesson-done-phase";
import { LessonLearnPhase } from "./lesson-learn-phase";
import { LessonQuizPhase } from "./lesson-quiz-phase";
import {
  forgetPendingLessonCompletions,
  rememberPendingLessonCompletion,
} from "../_lib/pending-completions-storage";

interface LessonViewProps {
  readonly slug: QuizLessonSlug;
  /** 確認問題の辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  /** 完了を記録できたあとの主導線（{@link LessonNextLink}） */
  readonly next: LessonNextLink;
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
        if ("error" in result && result.error === "authUnavailable") {
          // 認証サーバーが答えられなかった。通信の失敗と同じく預けて、
          // ログイン済みのホームで送り直す
          logExternalError("completeLesson", slug, result.error);
          rememberPendingLessonCompletion(slug, userId);
          setSaveState(userId === undefined ? "anonymous" : "failed");
          return;
        }
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
      <LessonLearnPhase
        completed={completed}
        inQuiz={inQuiz}
        index={index}
        total={questions.length}
        explanation={explanation}
        related={related}
        footer={footer}
        onStart={handleStart}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <LessonQuizPhase
        messageKey={messageKey}
        question={question}
        choices={choices}
        selected={selected}
        showHint={showHint}
        index={index}
        total={questions.length}
        onSelect={handleSelect}
        onShowHint={() => setShowHint(true)}
        onNext={handleNext}
        onReviewBody={handleReviewBody}
      />
    );
  }

  return (
    <LessonFollowUpProvider value={followUp}>
      <LessonDonePhase
        messageKey={messageKey}
        correctCount={correctCount}
        total={questions.length}
        saveState={saveState}
        next={next}
        progressStep={followUp?.next}
        signInHref={buildSignInHref(chapterHref(slug))}
        onRetrySave={handleRetrySave}
        onReviewBody={handleReviewBody}
        related={related}
        footer={footer}
      />
    </LessonFollowUpProvider>
  );
}

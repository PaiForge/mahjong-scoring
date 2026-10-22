"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { SignUpPanel } from "@/app/(user)/_components/sign-up-panel";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { JudgementMark } from "@/app/(user)/(public)/practice/_components/judgement-mark";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import type { JourneyStep } from "@mahjong-scoring/features/journey/journey";
import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import { resolveLessonNextStep } from "@mahjong-scoring/features/lessons/next-step";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";

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
export type SaveState =
  "idle" | "saving" | "saved" | "failed" | "anonymous" | "signedOut";

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
export interface LessonNextLink {
  readonly href: string;
  readonly label: string;
  readonly preview?: ReactNode;
  readonly previewLessonSlug?: QuizLessonSlug;
  readonly goal?: ReactNode;
}

/**
 * レッスンの完了の段階（`done`）
 * 完了の段階
 *
 * 全問正解なら合格と同じ success の囲み、間違えた問題があれば正答数と見直しの
 * 案内を中立の囲みで出す。完了の記録と次の一歩はどちらも同じ — 完了は
 * 「取り組んだ」印で、習得の判定は昇級試験が持つ。同じ 3 問を解き直させても
 * 答えを覚えるだけなので、全問正解を完了の条件にはしない。
 */
export function LessonDonePhase({
  messageKey,
  correctCount,
  total,
  saveState,
  next,
  progressStep,
  signInHref,
  onRetrySave,
  onReviewBody,
  related,
  footer,
}: {
  readonly messageKey: string;
  readonly correctCount: number;
  readonly total: number;
  readonly saveState: SaveState;
  readonly next: LessonNextLink;
  /** 本人の進み具合を踏まえた次の一歩。あれば `next` より優先する */
  readonly progressStep: JourneyStep | undefined;
  readonly signInHref: string;
  readonly onRetrySave: () => void;
  /** 本文の段階を履歴に積んで本文へ戻る */
  readonly onReviewBody: () => void;
  readonly related?: ReactNode;
  readonly footer?: ReactNode;
}) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const perfect = correctCount === total;
  return (
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
          <div
            className="space-y-3 rounded-panel border border-panel bg-surface-50 p-5"
            data-testid="lesson-review"
          >
            <p
              className="text-base font-bold text-surface-900"
              data-testid="lesson-score"
            >
              {t("doneScore", { correct: correctCount, total })}
            </p>
            <p className="text-sm leading-relaxed text-surface-700">
              {t("doneReviewAdvice")}
            </p>
            <Button
              variant="neutral"
              fullWidth
              onClick={onReviewBody}
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
            progressStep={progressStep}
            signInHref={signInHref}
            onRetrySave={onRetrySave}
          />
          {/* 全問正解でも表を見返したい人へ。次の一歩の下に移動だけの
              リンクで置き、主導線（次の一歩）とは押し間違えない間隔を取る。
              戻った本文は完了済みの形（解き直しのリンクと練習・試験）になる。
              間違えたときは結果の囲みの中に置くので出さない */}
          {perfect && (
            <div className="text-center">
              <button
                type="button"
                onClick={onReviewBody}
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
  );
}

interface CompletionActionsProps {
  readonly saveState: SaveState;
  readonly next: LessonNextLink;
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
 *   本人の一歩が別の所を指すときはボタンで送る（`resolveLessonNextStep`）
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
      const { usePlanned } = resolveLessonNextStep(
        undefined,
        progressStep,
        next.previewLessonSlug,
      );
      if (usePlanned && next.preview !== undefined) return next.preview;
      return (
        <>
          <LinkButton
            href={
              usePlanned || progressStep === undefined
                ? next.href
                : journeyStepHref(progressStep)
            }
            size="lg"
            fullWidth
            trailingIcon={<ChevronRightIcon className="size-5" />}
          >
            {usePlanned || progressStep === undefined
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

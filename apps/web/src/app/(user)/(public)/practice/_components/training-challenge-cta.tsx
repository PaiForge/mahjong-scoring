"use client";

import { useTranslations } from "next-intl";
import { ExamStartGate } from "@/app/(user)/(public)/exam/_components/exam-start-gate";
import { InfinityIcon } from "@/app/(user)/_components/icons/infinity-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { practicePlayHref } from "../_lib/practice-catalog";
import {
  PRACTICE_START_CTA_BLOCK_CLASS,
  PRACTICE_START_CTA_HINT_CLASS,
} from "./practice-start-cta";
import { WithUrlVariant } from "./with-url-variant";

/**
 * トレーニングの種類
 * トレーニング種別
 *
 * - `practice`: 練習のトレーニング。末尾からチャレンジへ送る
 * - `exam`: 昇級試験の模試。末尾から本番の試験へ送る（受験資格のゲート付き）
 */
export type TrainingVariant = "practice" | "exam";

/** チャレンジのルール（補足文に差し込む制限時間・ミス上限） */
export interface TrainingChallengeRules {
  readonly timeLimit: number;
  readonly mistakeLimit: number;
}

interface TrainingChallengeCtaProps {
  readonly challengeRules: TrainingChallengeRules;
  /**
   * 練習のスラッグ。チャレンジ（play ページ）のパスをここから組み、
   * 模試（`variant: "exam"`）では本番の受験資格を引くのにも使う
   */
  readonly slug: PracticeMenuSlug;
  readonly variant?: TrainingVariant;
}

function ChallengeButton({ href }: { readonly href: string }) {
  const tt = useTranslations("training");

  return (
    <LinkButton href={href} size="lg" fullWidth>
      <PlayIcon className="size-4" />
      {tt("challengeButton")}
    </LinkButton>
  );
}

/**
 * トレーニング画面の末尾に置くチャレンジへの導線
 * チャレンジ導線
 *
 * トレーニングは終了条件を持たないため、記録を取りに行くにはユーザーが
 * 自分で切り替えるしかない。説明ページまで戻らせず、解いている画面から
 * 直接チャレンジへ入れるようにする。
 *
 * ボタンと補足文の構成・間隔は説明ページの開始導線
 * （{@link import("./practice-start-cta").PracticeStartCta}）とクラスを共有し、
 * 「緑のボタン + その下の補足」という同じ姿で出す。その上に、今はどちらの
 * モードに居るのかと誘い文句を 2 行だけ置く。
 *
 * 模試（`variant: "exam"`）では本番の試験へ送る。ボタンの位置には説明ページと
 * 同じ受験ゲート（{@link ExamStartGate}）を置き、未ログイン・資格なしの人には
 * 本番ではなく登録・道場への導線を出す。緑のボタンを出して押した先で
 * サーバーに説明ページへ戻される、という往復を作らないため。文言も
 * 「チャレンジ」ではなく「本番の試験」で出す（今いるのが模試だと分かるように）。
 */
export function TrainingChallengeCta({
  challengeRules,
  slug,
  variant = "practice",
}: TrainingChallengeCtaProps) {
  const tp = useTranslations("practice");
  const tt = useTranslations("training");
  const tExamTraining = useTranslations("examTraining");
  const isExam = variant === "exam";

  return (
    <div className="space-y-4 border-t-2 border-dashed border-border/40 pt-8">
      {/* 今どちらのモードに居るかを示してから誘う。トレーニングは終了条件が
          無く、解き続けているうちに記録を取っているつもりになりやすい */}
      <div className="space-y-1 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-surface-400">
          <InfinityIcon className="size-3.5" />
          {isExam ? tExamTraining("modeActive") : tt("modeActive")}
        </p>
        <p className="text-sm font-bold text-surface-900">
          {isExam ? tExamTraining("realExamPrompt") : tt("challengePrompt")}
        </p>
      </div>

      {isExam ? (
        <ExamStartGate
          slug={slug}
          playHref={practicePlayHref(slug)}
          startLabel={tExamTraining("realExamButton")}
        />
      ) : (
        <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
          {/* 点数表早引き・役の翻数は出題設定（バリアント）を URL で受け取る。
              落とすと、絞った設定で練習していた人が既定の設定のチャレンジに
              着地してしまうため、今の URL の値で play のパスを組み直す
              （クエリ文字列をそのまま継ぎ足すと、既定が付いたパスに二重に
              付いて不正値になる） */}
          <WithUrlVariant slug={slug}>
            {(urlVariant) => (
              <ChallengeButton href={practicePlayHref(slug, urlVariant)} />
            )}
          </WithUrlVariant>
          <p className={PRACTICE_START_CTA_HINT_CLASS}>
            {tp("modeChallengeHint", {
              timeLimit: challengeRules.timeLimit,
              mistakeLimit: challengeRules.mistakeLimit,
            })}
          </p>
        </div>
      )}
    </div>
  );
}

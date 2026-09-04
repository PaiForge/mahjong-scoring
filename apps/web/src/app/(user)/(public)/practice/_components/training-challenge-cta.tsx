"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { InfinityIcon } from "@/app/(user)/_components/icons/infinity-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import {
  PRACTICE_START_CTA_BLOCK_CLASS,
  PRACTICE_START_CTA_HINT_CLASS,
} from "./practice-start-cta";

/** チャレンジのルール（補足文に差し込む制限時間・ミス上限） */
export interface TrainingChallengeRules {
  readonly timeLimit: number;
  readonly mistakeLimit: number;
}

interface TrainingChallengeCtaProps {
  /** チャレンジ（play ページ）のパス。出題条件のクエリは付けずに渡す */
  readonly challengeHref: string;
  readonly challengeRules: TrainingChallengeRules;
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
 * 今の URL の出題条件を引き継いだチャレンジのリンク
 *
 * 点数表早引き・役の翻数は出題条件を URL クエリで受け取る（親子・ツモロン・
 * 出題範囲）。クエリを落とすと、絞った条件で練習していた人が全条件の
 * チャレンジに着地してしまうため、そのまま持って移る。
 * `useSearchParams()` は静的ルートでこのサブツリーだけをクライアント描画に
 * するため、呼び出し側が Suspense で包む。
 */
function ChallengeButtonWithQuery({ href }: { readonly href: string }) {
  const query = useSearchParams().toString();

  return <ChallengeButton href={query ? `${href}?${query}` : href} />;
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
 */
export function TrainingChallengeCta({
  challengeHref,
  challengeRules,
}: TrainingChallengeCtaProps) {
  const tp = useTranslations("practice");
  const tt = useTranslations("training");

  return (
    <div className="space-y-4 border-t-2 border-dashed border-border/40 pt-8">
      {/* 今どちらのモードに居るかを示してから誘う。トレーニングは終了条件が
          無く、解き続けているうちに記録を取っているつもりになりやすい */}
      <div className="space-y-1 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-surface-400">
          <InfinityIcon className="size-3.5" />
          {tt("modeActive")}
        </p>
        <p className="text-sm font-bold text-surface-900">
          {tt("challengePrompt")}
        </p>
      </div>

      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        {/* プリレンダー時はクエリ無しの href を出し、hydrate 後に差し替える */}
        <Suspense fallback={<ChallengeButton href={challengeHref} />}>
          <ChallengeButtonWithQuery href={challengeHref} />
        </Suspense>
        <p className={PRACTICE_START_CTA_HINT_CLASS}>
          {tp("modeChallengeHint", {
            timeLimit: challengeRules.timeLimit,
            mistakeLimit: challengeRules.mistakeLimit,
          })}
        </p>
      </div>
    </div>
  );
}

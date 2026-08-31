"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useAuth } from "@/app/_contexts/auth-context";
import { fetchViewerRankSlugs } from "@/app/_lib/viewer-ranks";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { evaluateExamEligibility } from "@/lib/ranks/exam-eligibility";
import type { RankSlug } from "@/lib/ranks/registry";

interface ExamStartGateProps {
  /** 昇級試験の練習スラッグ（例: "pinfu-exam"） */
  readonly slug: PracticeMenuSlug;
  /** 開始ボタンのリンク先（説明ページ側で組み立てて渡す） */
  readonly playHref: string;
}

/**
 * 昇級試験の開始ボタン出し分け
 * 受験ゲート
 *
 * @description
 * 受験資格（`evaluateExamEligibility`）に応じて開始ボタンの位置に出すものを
 * 切り替える。未ログインはアカウント登録の CTA、未達成の上位級の試験は
 * 「先に◯級に合格を」の案内と道場への導線、それ以外は通常の開始ボタン。
 *
 * クライアントコンポーネントにしているのは、説明ページの静的配信を保つため
 * （サーバーで cookie を読むとページ全体が動的レンダリングに落ちる）。
 * ここは表示の出し分けだけで、強制は play ページの受験ガードと
 * `savePracticeResult` の保存ガードがサーバー側で行う。そのため段級位の
 * 取得に失敗したときは開始ボタンへ fail-open してよい — 資格がなければ
 * 開始した先でサーバーが説明ページへ戻す。
 */
export function ExamStartGate({ slug, playHref }: ExamStartGateProps) {
  const t = useTranslations("ranks");
  const tc = useTranslations("challenge");
  const { user, isLoading } = useAuth();
  // undefined は「未取得または取得失敗」。取得完了は hasFetched で区別する
  const [rankSlugs, setRankSlugs] = useState<readonly RankSlug[] | undefined>(
    undefined,
  );
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchViewerRankSlugs().then((slugs) => {
      if (cancelled) return;
      setRankSlugs(slugs);
      setHasFetched(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // 認証状態・段級位の解決中。開始ボタン（lg）と同じ高さの矩形で場所を
  // 確保し、確定後のレイアウトシフトを防ぐ
  if (isLoading || (user && !hasFetched)) {
    return <SkeletonBar radius="lg" className="h-[50px] w-full" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <LinkButton href="/sign-up" size="lg" fullWidth>
          {t("examGate.signUpButton")}
        </LinkButton>
        <p className="text-xs text-surface-500">
          {t("examGate.signUpNote")}{" "}
          <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
            {t("examGate.signInLink")}
          </Link>
        </p>
      </div>
    );
  }

  const eligibility =
    rankSlugs === undefined
      ? undefined // 取得失敗 — 表示は受験可に倒す（強制はサーバー側）
      : evaluateExamEligibility(practiceMenuBySlug(slug).menuType, rankSlugs);

  if (eligibility?.kind === "locked") {
    return (
      <div className="space-y-3">
        <HighlightPanel>
          <p className="text-sm leading-relaxed text-surface-700">
            {t("examGate.locked", {
              rank: t(`names.${eligibility.rank.slug}`),
              requiredRank: t(`names.${eligibility.requiredRank.slug}`),
            })}
          </p>
        </HighlightPanel>
        <LinkButton href="/dojo" variant="secondary" size="lg" fullWidth>
          {t("examGate.dojoButton")}
        </LinkButton>
      </div>
    );
  }

  return (
    <LinkButton href={playHref} size="lg" fullWidth>
      <PlayIcon className="size-4" />
      {tc("startButton")}
    </LinkButton>
  );
}

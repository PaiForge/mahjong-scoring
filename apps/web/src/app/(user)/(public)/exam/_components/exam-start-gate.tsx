"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useAuth } from "@/app/_contexts/auth-context";
import { fetchViewerRankSlugs } from "@/app/_lib/viewer-ranks";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { beltButtonVarsClass } from "@/lib/ranks/belt-colors";
import { evaluateExamEligibility } from "@/lib/ranks/exam-eligibility";
import type { RankSlug } from "@/lib/ranks/registry";

interface ExamStartGateProps {
  /** 昇級試験の練習スラッグ（例: "pinfu-exam"） */
  readonly slug: PracticeMenuSlug;
  /** 開始ボタンのリンク先（説明ページ側で組み立てて渡す） */
  readonly playHref: string;
}

/**
 * 受験できないときの「理由 → 次の行き先」の 1 組
 *
 * 理由を先に置く。ボタンだけを差し替えると、開始ボタンがあるはずの位置に
 * 別の遷移先が座っているように見え、押してから初めて受験できないと分かる。
 */
function BlockedCta({
  reason,
  children,
}: {
  readonly reason: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-surface-700">{reason}</p>
      {children}
    </div>
  );
}

/**
 * 昇級試験の開始ボタン出し分け
 * 受験ゲート
 *
 * @description
 * 受験資格（`evaluateExamEligibility`）に応じて開始ボタンの位置に出すものを
 * 切り替える。未ログインはアカウント登録、未達成の上位級の試験は道場への
 * 導線に差し替え、それ以外（次に取る級・達成済みの級の再挑戦）は通常の
 * 開始ボタンを出す。
 *
 * @design 受験できないときの導線を緑にしない
 *
 * 緑（primary）は「押して始める面」の色で、この位置の緑は「試験開始」と
 * しか読めない。受験できないときの導線は同じ位置に座るため、緑で塗ると
 * 開始ボタンと見分けが付かない。代わりに `ExamCtaCard`（教本章末の試験
 * カード）と同じ手を使う — 色は緑を避け（登録は白地の secondary、道場は
 * 先に取る級の帯色）、アイコンは再生ではなく右シェブロンにして、押した先が
 * 別のページであることを色とアイコンの両方で示す。
 *
 * 理由の文は琥珀の `HighlightPanel` に入れない。このコンポーネントの直前に
 * 合格条件（`ExamConditions`）の琥珀パネルが必ず置かれるため、琥珀の箱が
 * 2 つ縦に並んでどちらも注意書きに見えなくなる。
 *
 * @design クライアントコンポーネントである理由
 *
 * 説明ページの静的配信を保つため（サーバーで cookie を読むとページ全体が
 * 動的レンダリングに落ちる）。ここは表示の出し分けだけで、強制は play
 * ページの受験ガードと `savePracticeResult` の保存ガードがサーバー側で
 * 行う。そのため段級位の取得に失敗したときは開始ボタンへ fail-open して
 * よい — 資格がなければ開始した先でサーバーが説明ページへ戻す。
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
      <BlockedCta
        reason={
          <>
            {t("examGate.signUpNote")}{" "}
            <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
              {t("examGate.signInLink")}
            </Link>
          </>
        }
      >
        <LinkButton href="/sign-up" variant="secondary" size="lg" fullWidth>
          {t("examGate.signUpButton")}
          <ChevronRightIcon className="size-4" />
        </LinkButton>
      </BlockedCta>
    );
  }

  const eligibility =
    rankSlugs === undefined
      ? undefined // 取得失敗 — 表示は受験可に倒す（強制はサーバー側）
      : evaluateExamEligibility(practiceMenuBySlug(slug).menuType, rankSlugs);

  if (eligibility?.kind === "locked") {
    return (
      <BlockedCta
        reason={t("examGate.locked", {
          rank: t(`names.${eligibility.rank.slug}`),
          requiredRank: t(`names.${eligibility.requiredRank.slug}`),
        })}
      >
        {/* 帯色は「この試験の級」ではなく「先に取る級」。押した先の道場が
            出すのはその級の前提章と試験で、色もそちらに揃える */}
        <LinkButton
          href="/dojo"
          variant="belt"
          size="lg"
          fullWidth
          className={beltButtonVarsClass(eligibility.requiredRank.slug)}
        >
          {t("examGate.dojoButton")}
          <ChevronRightIcon className="size-4" />
        </LinkButton>
      </BlockedCta>
    );
  }

  return (
    <LinkButton href={playHref} size="lg" fullWidth>
      <PlayIcon className="size-4" />
      {tc("startButton")}
    </LinkButton>
  );
}

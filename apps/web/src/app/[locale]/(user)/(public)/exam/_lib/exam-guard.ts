import "server-only";

import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { evaluateExamEligibility } from "@mahjong-scoring/features/ranks/exam-eligibility";
import { practiceHref } from "@mahjong-scoring/features/routes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { localizedHref } from "@/i18n/public-path";

/**
 * 昇級試験の受験ガード（play ページ用）
 * 受験ガード
 *
 * @description
 * 受験資格（`evaluateExamEligibility`）がない場合は試験の説明ページへ
 * リダイレクトする。未ログインも受験不可 — 昇級試験は級の付与が本体
 * なので、説明ページのアカウント登録導線へ送る。説明ページは
 * リダイレクト理由（アカウント登録・先に取るべき級）を開始ボタンの位置に
 * 表示する。
 *
 * 呼び出し元の play ページには `export const dynamic = "force-dynamic"` が
 * 必要（cookie を読むため。Next.js の規約上ファイルごとに書く必要があり、
 * この関数では担保できない）。
 *
 * 仮にこのガードを迂回してプレイしても、採点（`submitExamResult`）と
 * 昇級判定（`gradeExamRun`）がサーバー側で同じ資格・順序を強制するため、
 * 飛び級は成立しない。
 *
 * 戻し先は play ページと同じ言語の説明ページ（英語の play からは `/en/exam/<級>`）。
 * 素の `practiceHref(slug)` へ送ると英語の受験者が日本語の説明ページへ落ち、
 * 言語切替を押さないと英語へ戻れない。説明ページは play と同じ公開単位で、
 * play を出している言語では必ず出しているため、公開状態を引き直さず
 * `localizedHref` で接頭辞だけ付ける（日本語は恒等で、戻し先の URL は変わらない）。
 * next-intl の `redirect` は locale の指定を要る形なので、リンクと同じ
 * `localizedHref` に揃える。
 *
 * @param slug - 昇級試験のスラッグ
 * @param locale - play ページの言語（ページの `prepareRouteLocale` の戻り値）
 */
export async function redirectUnlessExamEligible(
  slug: PracticeMenuSlug,
  locale: SupportedLocale,
): Promise<void> {
  const introHref = localizedHref(practiceHref(slug), locale);
  const user = await getOptionalUser();
  if (!user) {
    redirect(introHref);
  }

  const eligibility = evaluateExamEligibility(
    practiceMenuBySlug(slug).menuType,
    await getUserRankSlugs(user.id),
  );
  if (eligibility?.kind === "locked") {
    redirect(introHref);
  }
}

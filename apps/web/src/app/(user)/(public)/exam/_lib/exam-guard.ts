import "server-only";

import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { evaluateExamEligibility } from "@/lib/ranks/exam-eligibility";
import { practiceHref } from "../../practice/_lib/practice-catalog";

/**
 * 昇級試験の受験ガード（play ページ用）
 * 受験ガード
 *
 * @description
 * 受験資格（`evaluateExamEligibility`）がない場合は試験の説明ページへ
 * リダイレクトする。未ログインも受験不可 — 昇級試験は成績の記録と級の
 * 付与が本体なので、説明ページのアカウント登録導線へ送る。説明ページは
 * リダイレクト理由（アカウント登録・先に取るべき級）を開始ボタンの位置に
 * 表示する。
 *
 * 呼び出し元の play ページには `export const dynamic = "force-dynamic"` が
 * 必要（cookie を読むため。Next.js の規約上ファイルごとに書く必要があり、
 * この関数では担保できない）。
 *
 * 仮にこのガードを迂回してプレイしても、結果保存（`savePracticeResult`）と
 * 昇級判定（`checkAndGrantRanks`）がサーバー側で同じ資格・順序を強制する
 * ため、飛び級は成立しない。
 */
export async function redirectUnlessExamEligible(
  slug: PracticeMenuSlug,
): Promise<void> {
  const introHref = practiceHref(slug);
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

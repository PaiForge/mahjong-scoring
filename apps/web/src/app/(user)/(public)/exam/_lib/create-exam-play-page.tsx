import type { ComponentType } from "react";

import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { redirectUnlessExamEligible } from "./exam-guard";

interface ExamPlayPageConfig {
  /** 昇級試験のスラッグ（例: "fu-exam"）。受験ガードと metadata の両方がここから決まる */
  readonly slug: PracticeMenuSlug;
}

/**
 * 昇級試験のプレイページを生成するファクトリー関数
 * 昇級試験プレイページ生成
 *
 * 級ごとに違うのは受験ガードに渡すスラッグと描画する View だけで、
 * 「資格が無ければ説明ページへ送り、あれば盤面を描く」構図はどの級も同じ。
 *
 * スラッグを 1 度しか書かせないための関数でもある。各 page.tsx が
 * `redirectUnlessExamEligible("fu-exam")` と `createPracticePlayMetadata(...)`
 * を別々に呼ぶ形だと、コピペで「ガードは符・タイトルは満貫」の食い違いが
 * typecheck を通ってしまう（受験資格だけ他の級のものを見に行くため、
 * 誤りに気づくのは実際に弾かれたときになる）。
 *
 * 呼び出し元の page.tsx には `export const dynamic = "force-dynamic"` が
 * 必要（ガードが cookie を読むため。Next.js の規約上ファイルごとに書く
 * 必要があり、この関数では担保できない）。
 */
export function createExamPlayPage(
  PlayView: ComponentType,
  config: ExamPlayPageConfig,
) {
  const { slug } = config;

  return async function ExamPlayPage() {
    await redirectUnlessExamEligible(slug);
    return <PlayView />;
  };
}

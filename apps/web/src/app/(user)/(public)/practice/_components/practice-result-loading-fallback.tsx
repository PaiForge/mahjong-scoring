import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import {
  isExamMenuType,
  practiceMenuBySlug,
} from "@/lib/db/practice-menu-types";
import { practiceHref } from "../_lib/practice-catalog";
import {
  buildResultBreadcrumb,
  resultBreadcrumbParent,
} from "../_lib/result-breadcrumb";
import { ResultPageSkeleton } from "./result-page-skeleton";

interface Props {
  /** ルートスラッグ（例: "machi-fu"）。練習名の辞書 namespace と説明ページ URL を導出する */
  readonly slug: PracticeMenuSlug;
}

/**
 * 結果ページのローディングフォールバック
 * 結果ページローディング
 *
 * `/practice/<slug>/loading.tsx`（`PracticeLoading`）から result への遷移時に描画する。
 * その loading.tsx は pathname で振り分けるためクライアントコンポーネントであり、
 * 翻訳は `useTranslations()` で引く（`getTranslations()` は使えない）。
 *
 * 問題別フィードバック一覧の枠は出題数ぶん描く。`loading.tsx` は searchParams を
 * props では受け取れないが、クライアントコンポーネントなので `useSearchParams()`
 * で URL の `total` を読める。これを出さないと、チャレンジ終了直後の
 * `ChallengeShell` のスケルトン（一覧枠あり）→ このフォールバック（枠なし）→
 * 結果ページ（枠あり）と高さが一度縮んで伸び直す。一覧を持たない練習では
 * `total` があっても枠を出さない（レジストリの `hasProblemList` を見る）。
 */
export function PracticeResultLoadingFallback({ slug }: Props) {
  const { menuType, namespace, hasProblemList, hasSetup } =
    practiceMenuBySlug(slug);
  // 親一覧（練習一覧 or 道場）。実描画の ResultView と同じ判定で揃える
  const parent = resultBreadcrumbParent(practiceHref(slug));
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const tParent = useTranslations(parent.namespace);
  const searchParams = useSearchParams();
  const practiceTitle = t("title");
  const total = Number(searchParams.get("total") ?? 0);
  const problemCount = hasProblemList && Number.isFinite(total) ? total : 0;

  return (
    <ResultPageSkeleton
      practiceTitle={practiceTitle}
      breadcrumb={buildResultBreadcrumb({
        parentLabel: tParent("title"),
        parentHref: parent.href,
        practiceTitle,
        resultLabel: tc("resultSuffix"),
        introHref: practiceHref(slug),
      })}
      problemCount={problemCount}
      hasSetup={hasSetup}
      hasLeaderboard={!isExamMenuType(menuType)}
    />
  );
}

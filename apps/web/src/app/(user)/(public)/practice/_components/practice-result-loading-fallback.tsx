import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { buildResultBreadcrumb } from "../_lib/result-breadcrumb";
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
  const { namespace, hasProblemList } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const searchParams = useSearchParams();
  const practiceTitle = t("title");
  const total = Number(searchParams.get("total") ?? 0);
  const problemCount = hasProblemList && Number.isFinite(total) ? total : 0;

  return (
    <ResultPageSkeleton
      practiceTitle={practiceTitle}
      breadcrumb={buildResultBreadcrumb({
        practiceListLabel: tp("title"),
        practiceTitle,
        resultLabel: tc("resultSuffix"),
        introHref: `/practice/${slug}`,
      })}
      problemCount={problemCount}
    />
  );
}

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
 * `(public)/loading.tsx` の resolver から `/practice/:slug/result` に対して描画する。
 * `loading.tsx` は pathname で振り分けるためクライアントコンポーネントであり、
 * 翻訳は `useTranslations()` で引く（`getTranslations()` は使えない）。
 *
 * 出題数は URL クエリ（`?total=`）にあるが `loading.tsx` は searchParams を
 * 受け取れないため、問題別フィードバック一覧の枠はここでは出さない。
 * 一覧の高さは結果ページ本体（`ScoreProblemListLoader` 等）が確保する。
 */
export function PracticeResultLoadingFallback({ slug }: Props) {
  const { namespace } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const practiceTitle = t("title");

  return (
    <ResultPageSkeleton
      practiceTitle={practiceTitle}
      breadcrumb={buildResultBreadcrumb({
        practiceListLabel: tp("title"),
        practiceTitle,
        resultLabel: tc("resultSuffix"),
        introHref: `/practice/${slug}`,
      })}
    />
  );
}

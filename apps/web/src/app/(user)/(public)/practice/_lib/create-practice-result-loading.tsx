import { getTranslations } from "next-intl/server";

import { ResultPageSkeleton } from "../_components/result-page-skeleton";
import { buildResultBreadcrumb } from "./result-breadcrumb";

interface ResultLoadingConfig {
  /** ルートスラッグ（例: "machi-fu"）。説明ページ URL の生成に使う。 */
  readonly slug: string;
  /** 辞書の namespace（例: "machiFu"）。練習名（`title`）を引く。 */
  readonly namespace: string;
}

/**
 * 結果ページの `loading.tsx` を生成するファクトリー関数
 * 結果ページローディング生成
 *
 * 結果ページはクライアント遷移で表示されるため、`loading.tsx` が無いと
 * 直近の祖先 `(user)/(public)/loading.tsx`（汎用 `PageSkeleton`）が
 * 表示されてしまい、結果ページとは似ても似つかない形になる。
 * 各結果ルートにこのファクトリーで生成した `loading.tsx` を置くことで、
 * 結果ページと同じ形のスケルトンを表示する。
 *
 * 出題数は URL クエリ（`?total=`）にあるが `loading.tsx` は searchParams を
 * 受け取れないため、問題別フィードバック一覧の枠はここでは出さない。
 * 一覧の高さは結果ページ本体（`ScoreProblemListLoader` 等）が確保する。
 */
export function createPracticeResultLoading({
  slug,
  namespace,
}: ResultLoadingConfig) {
  return async function PracticeResultLoading() {
    const [t, tc, tp] = await Promise.all([
      getTranslations(namespace),
      getTranslations("challenge"),
      getTranslations("practice"),
    ]);
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
  };
}

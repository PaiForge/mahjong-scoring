import { ContentContainer } from "./content-container";
import { PageTitle } from "./page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface PageSkeletonProps {
  /** タイトルバーのプレースホルダ幅（Tailwind の w-* クラス）。 */
  readonly titleWidthClassName?: string;
  /** 本文に並べるリスト行プレースホルダの数。 */
  readonly rows?: number;
}

/**
 * loading.tsx 間で共有する汎用ページスケルトン。
 *
 * ナビゲーション中にサーバー描画が完了するまで即座に表示し、画面が固まって
 * 見える体感を解消する。`ContentContainer` + `PageTitle` で実描画と同じ
 * 全幅グレー帯を再現し CLS を防ぐ。個別ルートで忠実なスケルトンが必要な場合は
 * 各ルートに専用の loading.tsx を置く（そちらが優先される）。
 * 汎用ページスケルトン
 */
export function PageSkeleton({
  titleWidthClassName = "w-48",
  rows = 4,
}: PageSkeletonProps) {
  return (
    <ContentContainer>
      <PageTitle>
        <SkeletonBar
          as="span"
          tone={300}
          className={`inline-block h-7 ${titleWidthClassName} rounded align-middle`}
        />
      </PageTitle>

      <div className="space-y-4">
        <SkeletonBar className="h-6 w-40 rounded" />
        <SkeletonBar className="h-4 w-full rounded" tone={100} />
        <SkeletonBar className="h-4 w-11/12 rounded" tone={100} />
        <SkeletonBar className="h-4 w-4/5 rounded" tone={100} />
        <div className="mt-6 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBar
              key={i}
              className="h-14 w-full rounded-md"
              tone={100}
            />
          ))}
        </div>
      </div>
    </ContentContainer>
  );
}

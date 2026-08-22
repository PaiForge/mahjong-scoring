import type { BreadcrumbItem } from "@/app/(user)/_components/breadcrumb";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";
import { ProblemListSkeleton } from "./problem-list-skeleton";
import { ResultBlockSkeleton } from "./result-block-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface ResultPageSkeletonProps {
  /** 結果ページと同じ練習名を表示してタイトル帯を一致させる */
  readonly practiceTitle: string;
  /** 結果ページと同じパンくず（`buildResultBreadcrumb` で組み立てる） */
  readonly breadcrumb: readonly BreadcrumbItem[];
  /**
   * 問題別フィードバック一覧に並ぶ問題数。
   * 一覧を持たない練習や、出題数が分からない場面では 0（既定）にして枠自体を出さない。
   */
  readonly problemCount?: number;
}

/**
 * 結果ページの読み込み中スケルトン
 * 結果ページスケルトン
 *
 * 結果ページ（`ResultView`）と同じレイアウト（タイトル帯・結果見出し・スコアバー・
 * 経験値ブロック・アクションボタン・問題一覧・リーダーボード・パンくず）の
 * placeholder を描画する。次の 2 箇所から使う:
 *
 * 1. `ChallengeShell`（Client）— チャレンジ終了からリダイレクト開始までの間
 * 2. `PracticeResultLoadingFallback`（`/practice/<slug>/loading.tsx` 経由）— 結果ページの取得完了までの間
 *
 * このコンポーネント自身は翻訳を引かず、練習名とパンくずを props で受け取る
 * 純粋な描画に徹する。
 */
export function ResultPageSkeleton({
  practiceTitle,
  breadcrumb,
  problemCount = 0,
}: ResultPageSkeletonProps) {
  return (
    <ContentContainer breadcrumb={breadcrumb}>
      <PageTitle>{practiceTitle}</PageTitle>

      {/* 結果ページ（ResultView）と同じ space-y-8 で間隔を揃え、遷移時のズレを防ぐ */}
      <div className="space-y-8">
        {/* 「結果」見出し + スコアバー（ResultScoreBar と同じ構造） */}
        <section aria-hidden="true" className="space-y-3">
          <SectionTitleSkeleton />
          <div className="w-full space-y-3">
            <SkeletonBar className="h-8 w-full" tone={100} />
            {/* 凡例（正解 / 不正解）と正答率。実物と同じ flex-wrap にして
                狭い幅での折り返し（＝高さの増加）まで一致させる。 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <SkeletonBar className="h-4 w-20" />
                <SkeletonBar className="h-4 w-24" />
              </div>
              <SkeletonBar className="h-4 w-16" />
            </div>
          </div>
        </section>

        {/* 経験値 / 登録 CTA */}
        <ResultBlockSkeleton />

        {/* アクションボタン（もう一度 / 練習一覧に戻る）。ResultView と同じ縦積み・全幅。 */}
        <div aria-hidden="true" className="space-y-3">
          <SkeletonBar radius="lg" className="h-11 w-full" />
          <SkeletonBar radius="lg" className="h-11 w-full" tone={100} />
        </div>

        {/* 問題別フィードバック一覧（一覧を持つ練習のみ）。ResultView では
            children スロットとしてアクションボタンとリーダーボードの間に入る。 */}
        <ProblemListSkeleton count={problemCount} />

        {/* リーダーボードプレビュー */}
        <LeaderboardSkeleton />
      </div>
    </ContentContainer>
  );
}

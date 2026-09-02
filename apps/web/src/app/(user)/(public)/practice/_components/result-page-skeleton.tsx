import type { BreadcrumbItem } from "@/app/(user)/_components/breadcrumb";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";
import { ProblemListSkeleton } from "./problem-list-skeleton";
import { ResultBlockSkeleton } from "./result-block-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";

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
  /**
   * 結果ページが「設定を変更する」ボタンを出すか（レジストリの `hasSetup`）。
   * true の練習ではアクションボタンが 2 つ並ぶため、枠も 2 つ描いて
   * 結果ページとの高さのずれを防ぐ。
   */
  readonly hasSetup?: boolean;
  /**
   * 結果ページの種類（既定 "practice"）。
   *
   * 昇級試験（"exam"）は「結果」節が合否サマリで、経験値 / 過去記録の節と
   * ランキングプレビューを持たない。実体に無い枠を描くと、替わった瞬間に
   * ページがその高さぶん縮む。
   */
  readonly variant?: "practice" | "exam";
}

/**
 * 結果ページの読み込み中スケルトン
 * 結果ページスケルトン
 *
 * 結果ページ（`ResultView`）と同じレイアウト（タイトル帯・結果見出し・スコアバー・
 * 経験値ブロック・アクションボタン・練習一覧リンク・問題一覧・リーダーボード・パンくず）の
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
  hasSetup = false,
  variant = "practice",
}: ResultPageSkeletonProps) {
  const isExam = variant === "exam";
  return (
    <ContentContainer breadcrumb={breadcrumb}>
      <PageTitle>{practiceTitle}</PageTitle>

      {/* 結果ページ（ResultView）と同じ space-y-8 で間隔を揃え、遷移時のズレを防ぐ */}
      <div className="space-y-8">
        {/* 「結果」見出し + 中身。練習はスコアバー（ResultScoreBar）、
            試験は合否サマリ（ExamResultSummary）と同じ構造 */}
        <section aria-hidden="true" className="space-y-3">
          <SectionTitleSkeleton />
          {isExam ? <ExamResultSummarySkeleton /> : <ResultScoreBarSkeleton />}
        </section>

        {/* 経験値 / 登録 CTA（試験は持たない） */}
        {!isExam && <ResultBlockSkeleton />}

        {/* アクションボタンと練習一覧へのリンク。ResultView と同じ入れ子で組む —
            内側 gap-3 がボタン同士のリズム、外側 SUB_LINK_GAP が「ボタン群 →
            補助リンク」の境界。矩形の寸法も実物の実測値をそのまま置く:
            ボタンは lg（border-3 の 3px×2 + py-3 の 12px×2 + text-sm 20px = 50px）、
            補助リンクは text-sm の <p> 1 行ぶん 24px。ここが 44px + space-y-3 の
            ままだと、スケルトンから実体へ替わるときにボタンから下が 10px 沈む。 */}
        <div aria-hidden="true" className={`flex flex-col ${SUB_LINK_GAP}`}>
          <div className="flex flex-col gap-3">
            <SkeletonBar radius="lg" className="h-[50px] w-full" />
            {hasSetup && (
              <SkeletonBar radius="lg" className="h-[50px] w-full" tone={100} />
            )}
          </div>
          <SkeletonBar className="mx-auto h-6 w-32" />
        </div>

        {/* 問題別フィードバック一覧（一覧を持つ練習のみ）。ResultView では
            children スロットとしてアクションボタンとリーダーボードの間に入る。 */}
        <ProblemListSkeleton count={problemCount} />

        {/* リーダーボードプレビュー（試験は持たない） */}
        {!isExam && <LeaderboardSkeleton />}
      </div>
    </ContentContainer>
  );
}

/** `ResultScoreBar` の placeholder（棒 + 凡例 + 正答率） */
function ResultScoreBarSkeleton() {
  return (
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
  );
}

/**
 * `ExamResultSummary` の placeholder
 *
 * 合否パネル（3 行の中で一番高い不合格時の形: 合否 + 正解数の行 +
 * 「あと N 問」）、正解数と平均回答時間の 2 行、終わり方の 1 行。合格時は
 * 「あと N 問」が無く 28px 低いが、実体はその時点で確定しているので
 * 高い方に合わせる（縮む方向のずれは伸びる方向より目立たない）。
 * 実物の枠と面（success / destructive）は写さず灰色にする
 * （`ExamIntroSkeleton` と同じ理由）。
 */
function ExamResultSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-3 border-surface-100 bg-surface-50 p-5">
        <div className="flex flex-col items-center">
          <SkeletonBar className="h-8 w-20" tone={100} />
          <SkeletonBar className="mt-1 h-5 w-48 max-w-full" tone={100} />
          <SkeletonBar className="mt-2 h-7 w-24" tone={100} />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonBar className="h-5 w-24" tone={100} />
            <SkeletonBar className="h-5 w-16" tone={100} />
          </div>
        ))}
      </div>
      <SkeletonBar className="h-4 w-32" tone={100} />
    </div>
  );
}

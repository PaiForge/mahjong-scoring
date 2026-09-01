import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ResultBlockSection } from "./result-block-section";

/**
 * 結果ブロック（登録 CTA / 記録セクション）のスケルトン
 * 結果ブロックスケルトン
 *
 * Server Component 取得完了前の placeholder。実分岐（`SignUpCta` /
 * `RecordSection`）と同じ `ResultBlockSection` に載せることで、どの分岐に
 * 解決しても「SectionTitle + 本文」の輪郭と最小高さが一致し、CLS を 0 に
 * 抑える。ログイン済みで grant が無い場合も `RecordSection` が必ず描画される
 * ため、スケルトンだけあって実体が消える分岐は存在しない。
 */
export function ResultBlockSkeleton() {
  return (
    <ResultBlockSection aria-hidden data-testid="result-block-skeleton">
      <SectionTitleSkeleton />
      {/* レベル表示と獲得 EXP の行 */}
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-5 w-20" />
        <SkeletonBar className="h-6 w-24" />
      </div>
      {/* 進捗率テキスト + 進捗バー */}
      <div>
        <div className="mb-1.5 flex items-center justify-end">
          <SkeletonBar className="h-4 w-10" />
        </div>
        <SkeletonBar radius="full" className="h-2 w-full" tone={100} />
      </div>
    </ResultBlockSection>
  );
}

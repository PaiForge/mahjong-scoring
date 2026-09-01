import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ResultBlockSection } from "./result-block-section";

/**
 * 結果ブロック（登録 CTA / 記録セクション）のスケルトン
 * 結果ブロックスケルトン
 *
 * Server Component 取得完了前の placeholder。実分岐（`SignUpCta` /
 * ログイン済みの記録セクション）と同じ `ResultBlockSection` に載せることで、
 * どの分岐に解決しても「SectionTitle + 本文」の輪郭と最小高さが一致し、
 * CLS を 0 に抑える。最小高さの根拠は `ResultBlockSection` を参照。
 *
 * 注意: ログイン済みで `grant` クエリが無い場合（スコア保存に失敗した等）は
 * `AsyncResultBlock` が何も描画しないため、この最小高さが丸ごと消える。
 * 発生条件が限られるため、一般的なケースの CLS を優先してこの挙動を許容する。
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

import { SectionTitleSkeleton } from "@/app/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 経験値セクション / 登録 CTA のスケルトン
 * 結果ブロックスケルトン
 *
 * Server Component 取得完了前の placeholder。ExpGainDisplay / SignUpCta
 * 両方の最終高さを内包する固定高さ枠を持ち、CLS を 0 に抑える。
 *
 * 高さの根拠:
 * - `ExpGainDisplay`（ログイン済み・EXP あり）: 約 110〜150px（levelUp バッジの有無）
 * - `SignUpCta`（未ログイン）: 約 160〜180px（モバイル縦並びが最大）
 * 両者を包含するため `min-h-[180px]` で固定する。
 *
 * 注意: ログイン済みで `grant` クエリが無い場合（スコア保存に失敗した等）は
 * `AsyncResultBlock` が何も描画しないため、この 180px が丸ごと消える。
 * 発生条件が限られるため、一般的なケースの CLS を優先してこの挙動を許容する。
 */
export function ResultBlockSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="min-h-[180px] space-y-3"
      data-testid="result-block-skeleton"
    >
      {/* ExpGainDisplay の SectionTitle に対応（SignUpCta には見出しが無い） */}
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
    </section>
  );
}

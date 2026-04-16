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
 */
export function ResultBlockSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="mt-10 min-h-[180px] space-y-3"
      data-testid="result-block-skeleton"
    >
      <div className="h-6 w-24 animate-pulse rounded bg-surface-200" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-200" />
      <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-200" />
    </section>
  );
}

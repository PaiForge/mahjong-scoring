/**
 * リーダーボードプレビューのスケルトン
 * リーダーボードスケルトン
 *
 * `LeaderboardPreview`（上位3名 + "もっと見る" リンク）の placeholder。
 *
 * 高さの根拠:
 * - SectionTitle(見出し) ~24px + space-y-3
 * - テーブル header 1行 + body 3行（各 ~40px）
 * - "もっと見る" リンク ~28px
 * 合計でおおよそ 280px 前後。最終コンテンツと揃えるため `min-h-[280px]`。
 *
 * 注意: `rows.length === 0` のとき `LeaderboardPreview` は何も描画しないため、
 * その場合は最終コンテンツへの遷移で `min-h` 分の高さが「消える」ことになる。
 * ただし練習のランキングが 0 行のケースは初回ユーザー限定で極めて稀であり、
 * 一般ユーザーの CLS を優先する設計としてこの挙動を許容する。
 */
export function LeaderboardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-12 min-h-[280px] space-y-3"
      data-testid="leaderboard-skeleton"
    >
      <div className="h-6 w-32 animate-pulse rounded bg-surface-200" />
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-surface-100" />
        <div className="h-10 w-full animate-pulse rounded bg-surface-200" />
        <div className="h-10 w-full animate-pulse rounded bg-surface-200" />
        <div className="h-10 w-full animate-pulse rounded bg-surface-200" />
      </div>
      <div className="flex justify-center pt-2">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-200" />
      </div>
    </div>
  );
}

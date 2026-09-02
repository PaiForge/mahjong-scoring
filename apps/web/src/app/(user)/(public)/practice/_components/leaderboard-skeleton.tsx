import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * リーダーボードプレビューのスケルトン
 * リーダーボードスケルトン
 *
 * `LeaderboardPreview`（上位3名 + "もっと見る" リンク）の placeholder。
 *
 * 高さの根拠（2026-09 に puppeteer で実測。プレビューは常に 1〜3 位を出すため
 * 各行にメダルが入り、行の高さは安定する）:
 * - 375 / 390 / 430px 幅: 306px
 * - sm 以上（768 / 1280px 幅）: 309px
 * - 360px 幅: 322px — プレイヤー名が折り返すぶん伸びる。折り返すかは
 *   ランキングに載っている名前次第なのでスケルトンからは追えず、ここは合わせない
 *
 * 上 2 つを包含する `min-h-[310px]` を実体（`LeaderboardPreview`）と共有する。
 * 揃える前は 280px で、解決時に 26px 伸びていた。
 *
 * スケルトン自身の素の高さ（バーの積み上げ）は 268px でこの min-h には届かない。
 * バーの寸法を実測に合わせ込むのではなく min-h を効かせて埋める — 実体の高さは
 * テーブルの行組みとメダルで決まっており、バーの高さを足し引きして一致させても
 * 根拠のない数字が増えるだけで、行組みが変わればどのみち測り直しになるため。
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
      className="min-h-[310px] space-y-3"
      data-testid="leaderboard-skeleton"
    >
      <SectionTitleSkeleton width="w-32" />
      <div className="space-y-2">
        <SkeletonBar className="h-10 w-full" tone={100} />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
      </div>
      <div className="flex justify-center pt-2">
        <SkeletonBar className="h-4 w-20" />
      </div>
    </div>
  );
}

import { SkeletonBar } from "@/app/_components/skeleton-bar";

/** グリッドの列数（Tailwind は完成したクラス名しか拾えないので表で持つ） */
const GRID_COLUMNS_CLASSES = {
  2: "grid gap-6 sm:grid-cols-2",
  3: "grid gap-6 sm:grid-cols-3",
} as const;

/**
 * 期間内の数と累計を並べる KPI カードのグリッド
 * KPI カードグリッド
 *
 * 統計ページ（レッスン・チャレンジ・問題の保存状況）で同じ形のカードを並べる。
 * 各カードは 期間内の数（大きく）→ 累計 → 期間 の順。
 *
 * @param items - カード。`label` は React の key も兼ねるので重複させない
 * @param period - 期間の表示（例: `2026-01-01 ~ 2026-01-28`）
 * @param columns - sm 以上の列数
 * @param formatCumulative - 累計の文言（引数は桁区切り済みの数）
 */
export function AdminKpiGrid({
  items,
  period,
  columns,
  formatCumulative,
}: {
  readonly items: readonly {
    readonly label: string;
    readonly value: number;
    readonly cumulative: number;
  }[];
  readonly period: string;
  readonly columns: keyof typeof GRID_COLUMNS_CLASSES;
  readonly formatCumulative: (count: string) => string;
}) {
  return (
    <div className={GRID_COLUMNS_CLASSES[columns]}>
      {items.map((item) => (
        <section key={item.label} className="admin-kpi space-y-2">
          <p className="text-sm font-medium text-surface-600">{item.label}</p>
          <p className="text-5xl leading-[56px] font-semibold tracking-tight text-primary-900 tabular-nums">
            {item.value.toLocaleString("ja-JP")}
          </p>
          <p className="text-xs text-surface-500">
            {formatCumulative(item.cumulative.toLocaleString("ja-JP"))}
          </p>
          <p className="text-xs text-surface-500">{period}</p>
        </section>
      ))}
    </div>
  );
}

/**
 * `AdminKpiGrid` のスケルトン
 * KPI カードグリッドスケルトン
 *
 * @param count - カードの枚数
 * @param columns - sm 以上の列数（`AdminKpiGrid` と同じ値にする）
 */
export function AdminKpiGridSkeleton({
  count,
  columns,
}: {
  readonly count: number;
  readonly columns: keyof typeof GRID_COLUMNS_CLASSES;
}) {
  return (
    <div className={GRID_COLUMNS_CLASSES[columns]}>
      {Array.from({ length: count }, (_, i) => (
        <section key={i} className="admin-kpi space-y-2">
          <SkeletonBar className="h-5 w-40" tone={100} />
          <SkeletonBar className="h-14 w-20" />
          <SkeletonBar className="h-4 w-24" tone={100} />
          <SkeletonBar className="h-4 w-48" tone={100} />
        </section>
      ))}
    </div>
  );
}

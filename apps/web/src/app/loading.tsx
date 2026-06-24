import { PageSkeleton } from "@/app/_components/page-skeleton";

/**
 * ルート直下の入口ローディング状態（最上位キャッチオール）。
 *
 * `admin/layout.tsx` は `requireAdmin()`（getUser + DB 照会）で待機するが、
 * `loading.tsx` は同階層 layout の「子」を Suspense で包むため、`admin/loading.tsx`
 * では admin レイアウト自身の認証待ちを覆えない。覆うには 1 つ上の階層に境界が
 * 必要であり、admin はルート直下にあるためここに置く。これで admin 領域への入口
 * （認証待ち）で即スケルトンが表示され、画面が固まって見える体感を解消する。
 *
 * `(user)` 配下は同階層レイアウトが同期的で、かつ近接する loading.tsx
 *（`(user)/loading.tsx` / `(public)/loading.tsx`）が優先されるため影響しない。
 * シェル描画前の汎用スケルトンのため、エンドユーザー向け `PageSkeleton` を用いる。
 * ローディング
 */
export default function RootLoading() {
  return <PageSkeleton />;
}

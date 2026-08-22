import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";

/**
 * ユーザー名登録ページのローディング状態。
 *
 * loading.tsx は入れ子にすると外側が先に描画されて二重に見えるため、
 * (user) 直下の汎用フォールバックは置かずルートごとに 1 つだけ持つ。
 * ローディング
 */
export default function Loading() {
  return <PageSkeleton rows={2} />;
}

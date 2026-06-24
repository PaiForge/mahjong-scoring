import { PageSkeleton } from "@/app/_components/page-skeleton";

/**
 * (user) シェル配下の入口ローディング状態。
 *
 * 保護領域への遷移では `(protected)` / `(confirmed)` レイアウトが認証チェック
 * （getUser + DB 照会）で待機する。これらのレイアウトの待機は子セグメントの
 * loading.tsx（例: mypage/loading.tsx）より上位にあり覆われないため、ここに
 * 境界を置いて入口で即スケルトンを表示する。公開ルートは近接する
 * (public)/loading.tsx が優先されるため影響しない。
 * ローディング
 */
export default function UserLoading() {
  return <PageSkeleton />;
}

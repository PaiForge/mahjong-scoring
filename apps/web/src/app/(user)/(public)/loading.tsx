import { PageSkeleton } from "@/app/_components/page-skeleton";

/**
 * 公開ルート共通のローディング状態（キャッチオール）。
 *
 * 個別の loading.tsx を持たない公開ルートのナビゲーション時に、サーバー描画
 * 完了まで即座にスケルトンを表示する。より忠実なスケルトンが必要なルートは
 * 個別に loading.tsx を置く（そちらが優先される）。
 * ローディング
 */
export default function PublicLoading() {
  return <PageSkeleton />;
}

/** 認証が必要なため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

/**
 * 保護領域レイアウト（パススルー）。
 *
 * 認証・BAN・プロフィールのガードは各ページの requireConfirmedUser() /
 * requireProvisionalUser() で行う。レイアウトで await すると、その待機が上位の
 * (user)/loading.tsx（汎用スケルトン）に拾われ、ページ個別の loading.tsx が
 * リロード時に表示されないため。新規ページ追加時は必ずいずれかのガードを呼ぶこと。
 */
export default function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}

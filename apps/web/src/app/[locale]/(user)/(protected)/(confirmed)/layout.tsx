/**
 * 本登録（プロフィール作成済み）領域レイアウト（パススルー）。
 *
 * ガードは各ページの requireConfirmedUser() で行う（リロード時もページ個別の
 * loading.tsx を表示するため。詳細は (protected)/layout.tsx のコメント参照）。
 * このグループに新規ページを追加したら必ず requireConfirmedUser() を呼ぶこと。
 *
 * 本登録レイアウト
 */
export default function ConfirmedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}

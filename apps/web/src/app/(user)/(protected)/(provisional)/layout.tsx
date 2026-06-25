/**
 * 仮登録（プロフィール未作成）領域レイアウト（パススルー）。
 *
 * ガードは各ページの requireProvisionalUser() で行う（リロード時もページ個別の
 * loading.tsx を表示するため。詳細は (protected)/layout.tsx のコメント参照）。
 * このグループに新規ページを追加したら必ず requireProvisionalUser() を呼ぶこと。
 *
 * 仮登録レイアウト
 */
export default function ProvisionalLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}

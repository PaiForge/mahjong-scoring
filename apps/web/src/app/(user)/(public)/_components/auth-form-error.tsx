interface AuthFormErrorProps {
  readonly message?: string;
}

/**
 * 認証フォーム共通のエラーメッセージ表示
 * 認証エラー表示
 *
 * `message` が空文字 / undefined の場合は何も描画しない。
 */
export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) return null;
  return <p className="text-center text-sm text-red-600">{message}</p>;
}

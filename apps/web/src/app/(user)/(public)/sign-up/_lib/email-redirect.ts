import { SITE_URL } from "@/config";

/**
 * 登録確認メールのリンクの着地先
 * 登録確認メールのリダイレクト先
 *
 * 登録時（`signUp`）と再送時（`resend`）の両方で同じ値を渡す。再送で渡し
 * 忘れると GoTrue は `site_url`（LP）へ着地させ、`/auth/callback` で
 * セッションを確立しないままメールアドレスだけが確認済みになる。届かずに
 * 再送するユーザーほどこの経路を通るので、片方だけ直すことがないよう
 * 1 か所に置く。
 */
export const SIGN_UP_EMAIL_REDIRECT_TO = `${SITE_URL}/auth/callback`;

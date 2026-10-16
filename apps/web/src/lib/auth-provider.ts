/**
 * 画面に名前を出すログインプロバイダ
 * 既知のログインプロバイダ
 *
 * Supabase が `app_metadata.provider` に入れる値。`apple` はアプリの「Apple で
 * ログイン」で登録した人で、web にはその入口が無いが、同じアカウントで web に
 * ログインするとアカウントのページや管理画面でこの値を見る。辞書
 * （`mypageAccount.login.providers`・`admin.userDetail.account.providers`）は
 * ここに並べたものすべてに名前を持つ（`auth-provider.test.ts` が食い違いを落とす）。
 */
export const KNOWN_AUTH_PROVIDERS = ["email", "google", "apple"] as const;

export type KnownAuthProvider = (typeof KNOWN_AUTH_PROVIDERS)[number];

const knownAuthProviderSet: ReadonlySet<string> = new Set(KNOWN_AUTH_PROVIDERS);

/**
 * 辞書に名前を持つプロバイダか
 * 既知プロバイダ判定
 *
 * 知らない値（Supabase に新しいプロバイダを足した直後等）は false。呼び出し側は
 * その値をそのまま出し、辞書を引かない（無いキーを引くと next-intl がエラーを出す）。
 */
export function isKnownAuthProvider(
  provider: string | undefined,
): provider is KnownAuthProvider {
  return provider !== undefined && knownAuthProviderSet.has(provider);
}

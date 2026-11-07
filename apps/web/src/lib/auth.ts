import { cache } from "react";
import { redirect } from "next/navigation";

import { currentLocale } from "@/i18n/current-locale";
import { localizedHref } from "@/i18n/public-path";

import { isAuthServiceFailure } from "./auth-service-failure";
import { type AuthUser, claimsToAuthUser, userToAuthUser } from "./auth-user";
import { getAccountStanding, isUserBanned } from "./ban";
import { createClient } from "./supabase/server";
import { getProfileByUserId } from "./db/queries";
import { buildSignInHref } from "./redirect";

/**
 * ページガードの追加の指定
 * 認証ガードオプション
 *
 * ガードの飛ばし先（`/sign-in`・`/banned`・`/mypage/setup-username`・`/mypage`）は
 * 今のリクエストの言語（`currentLocale()`）で `localizedHref` を通す。英語の
 * ページから日本語のサインインへ落とさないため。これらの行き先は英語でも
 * 公開しているページなので、`resolvePublishedHref`（未公開なら undefined）では
 * なく `localizedHref` で組む。言語はページの `prepareRouteLocale` が先に
 * 確定させている（ガードはその後に呼ばれる）ので、ここで読んでも静的生成を
 * 失わない。言語を読むのは飛ばすときだけ。
 *
 * ガードは今のパスを知らない（`headers()` からパスは取れず、proxy にヘッダを
 * 足すと proxy の責務が増える）。サインイン後の戻り先は、自分のパスを
 * `prepareRouteLocale` に渡しているページが同じ値から組んで渡す。
 */
export interface AuthGuardOptions {
  /**
   * サインイン後の戻り先。公開 URL の形（`localizedHref(path, locale)` 済み。
   * 英語なら `/en/...`）で渡す。省略すると `?redirect=` を付けない（従来どおり）
   */
  readonly returnTo?: string;
}

/**
 * JWT の claims から認証済みユーザーを読む。取れなければ undefined
 * claimsユーザー読み取り
 *
 * getClaims() は非対称署名キー構成では JWT をローカル検証するため、
 * getUser() のような認証サーバーへのネットワーク往復が不要になり、
 * 保護ページ遷移ごとの認証待ちを短縮できる（対称鍵時は getUser に
 * フォールバックし従来同等）。cache() によりリクエスト内では1回だけ評価される。
 * 引数を持たないので、ガードに渡す `returnTo` が違っても問い合わせは 1 回。
 */
const readClaimsUser = cache(async (): Promise<AuthUser | undefined> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return undefined;
  return claimsToAuthUser(claims);
});

/**
 * 未認証のときに飛ばすサインインページの URL（今の言語）
 *
 * `returnTo` が無ければ `?redirect=` を付けない。`buildSignInHref` も
 * `localizedHref` を通すので、ここで二重に `/en` を付けない。
 */
async function signInRedirectHref(
  returnTo: string | undefined,
): Promise<string> {
  const locale = await currentLocale();
  return returnTo === undefined
    ? localizedHref("/sign-in", locale)
    : buildSignInHref(returnTo, locale);
}

/** 今の言語でガードの飛ばし先（`/banned` 等のロケール非依存のパス）へ飛ばす */
async function redirectLocalized(path: string): Promise<never> {
  redirect(localizedHref(path, await currentLocale()));
}

/**
 * 認証済みユーザーを返す。未認証の場合はサインインページへリダイレクト。
 * 認証済みユーザー取得
 *
 * サインインページは今の言語のもの（英語なら `/en/sign-in`）。
 * `options.returnTo` があればサインイン後にそこへ戻す（{@link AuthGuardOptions}）。
 * 問い合わせは cache() 済みの claims の読み取りを共有する。
 *
 * @param options - サインイン後の戻り先
 */
export const getAuthenticatedUser = async (
  options?: AuthGuardOptions,
): Promise<AuthUser> => {
  const user = await readClaimsUser();
  if (!user) {
    redirect(await signInRedirectHref(options?.returnTo));
  }
  return user;
};

/**
 * 認証済みユーザーとプロフィールを返す。未認証の場合はサインインページへリダイレクト。
 * 認証済みユーザー+プロフィール取得
 *
 * プロフィールの取得（`getProfileByUserId`）は userId で cache() 済み。
 */
async function getAuthenticatedProfile(returnTo: string | undefined) {
  const user = await getAuthenticatedUser({ returnTo });
  const profile = await getProfileByUserId(user.id);
  return { user, profile };
}

/**
 * {@link requireConfirmedUser} の本体。cache() のキーを `returnTo` の文字列にする
 *
 * React の cache() は引数を参照で比べるので、`options` のオブジェクトを
 * そのままキーにすると呼ぶたびに別のキーになる。文字列に開いてから渡す。
 * `returnTo` の違う 2 回の呼び出しは別のキーになり評価も 2 回になるが、
 * ガードはページが 1 回だけ呼ぶので同じリクエストでは起きない（起きても
 * claims・プロフィール・BAN の問い合わせはそれぞれの cache() を共有する）。
 */
const requireConfirmedUserFor = cache(async (returnTo: string | undefined) => {
  const { user, profile } = await getAuthenticatedProfile(returnTo);

  if (await isUserBanned(user.id)) {
    return redirectLocalized("/banned");
  }
  if (!profile) {
    return redirectLocalized("/mypage/setup-username");
  }

  return { user, profile };
});

/**
 * 本登録済み（プロフィール作成済み）ユーザーを要求するページガード。
 * 未認証 → /sign-in、BAN → /banned、プロフィール未作成 → /mypage/setup-username。
 * 本登録ユーザーガード
 *
 * 飛ばし先はどれも今の言語の URL（英語なら `/en/sign-in` 等）。
 * `options.returnTo` はサインイン後の戻り先（{@link AuthGuardOptions}）。
 *
 * 認証ガードを (confirmed) レイアウトではなく各ページで呼ぶことで、認証待ちを
 * ページ自身の loading.tsx 境界内に収め、リロード時もページ個別スケルトンを表示する。
 * リクエスト内の重複排除は {@link requireConfirmedUserFor} を参照。
 *
 * @param options - サインイン後の戻り先
 */
export const requireConfirmedUser = (options?: AuthGuardOptions) =>
  requireConfirmedUserFor(options?.returnTo);

/**
 * {@link requireProvisionalUser} の本体。cache() のキーを `returnTo` の文字列にする
 * （理由は {@link requireConfirmedUserFor} と同じ）
 */
const requireProvisionalUserFor = cache(
  async (returnTo: string | undefined) => {
    const { user, profile } = await getAuthenticatedProfile(returnTo);

    if (await isUserBanned(user.id)) {
      return redirectLocalized("/banned");
    }
    if (profile) {
      return redirectLocalized("/mypage");
    }

    return { user };
  },
);

/**
 * 仮登録（プロフィール未作成）ユーザーを要求するページガード。
 * 未認証 → /sign-in、BAN → /banned、プロフィール作成済み → /mypage。
 * 仮登録ユーザーガード
 *
 * 飛ばし先はどれも今の言語の URL。`options.returnTo` はサインイン後の戻り先。
 * 認証ガードを (provisional) レイアウトではなく各ページで呼ぶための関数。
 *
 * @param options - サインイン後の戻り先
 */
export const requireProvisionalUser = (options?: AuthGuardOptions) =>
  requireProvisionalUserFor(options?.returnTo);

/**
 * 認証済みユーザーまたは undefined を返す。リダイレクトなし。
 * getClaims() でローカル検証する（getAuthenticatedUser と同様）。
 * オプショナルユーザー取得
 */
export const getOptionalUser = cache(
  async (): Promise<AuthUser | undefined> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    return claims ? claimsToAuthUser(claims) : undefined;
  },
);

/**
 * 認証サーバーに問い合わせた結果。user が取れなかったときは、その理由が
 * 「答えられなかった」（届かない・混んでいる・障害）か「無効と答えた」かも持つ
 * 検証済みユーザー問い合わせ結果
 *
 * cache() によりリクエスト内では 1 回だけ問い合わせる。`getOptionalVerifiedUser`
 * と `isVerifiedUserUnavailable` はこれを読むだけなので、両方を呼んでも
 * 往復は増えない。
 */
const getVerifiedUserResult = cache(
  async (): Promise<
    | { readonly user: AuthUser }
    | { readonly user: undefined; readonly unavailable: boolean }
  > => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    // Supabase API は null を返すが、プロジェクト規約に合わせ undefined に正規化する
    if (user) return { user: userToAuthUser(user) };
    return {
      user: undefined,
      unavailable: error !== null && isAuthServiceFailure(error),
    };
  },
);

/**
 * 認証済みユーザーまたは undefined を返す。リダイレクトなし。
 * 検証付きオプショナルユーザー取得
 *
 * `getOptionalUser` と違い getUser() で認証サーバーに問い合わせる。
 * JWT のローカル検証では失効済みセッションを有効期限まで検出できないため、
 * DB へ書き込む Server Action ではこちらを使い、失効を即座に反映する。
 * 表示専用の読み取りには `getOptionalUser`（ローカル検証・低レイテンシ）を使うこと。
 *
 * 認証サーバーが答えられなかったときも undefined になる。それを「未ログイン」と
 * 区別したい書き込み（記録を黙って捨てたくない `resolveRecorder`）は
 * {@link isVerifiedUserUnavailable} で確かめる。
 */
export async function getOptionalVerifiedUser(): Promise<AuthUser | undefined> {
  return (await getVerifiedUserResult()).user;
}

/**
 * `getOptionalVerifiedUser` が undefined を返したのは、認証サーバーが答えられ
 * なかった（届かない・回数制限・障害）からか
 * 認証サーバー不通判定
 *
 * cookie が無い・失効している・無効なトークンは「未ログイン」であり false。
 * 分け方は {@link isAuthServiceFailure}。user が取れていれば常に false。
 */
export async function isVerifiedUserUnavailable(): Promise<boolean> {
  const result = await getVerifiedUserResult();
  return result.user === undefined && result.unavailable;
}

/**
 * ゲスト専用ページのガード。ログイン済みなら退避先へリダイレクトする。
 * ゲスト専用ガード
 *
 * サインイン・サインアップ・メール確認待ちのように「未ログインでのみ意味がある」
 * ページで使う。呼び出し元のページには
 * `export const dynamic = "force-dynamic"` が必要（Next.js の規約上
 * ファイルごとに書く必要があるため、この関数では担保できない）。
 *
 * @param to - 退避先の URL（公開 URL の形）。省略時は今の言語の
 *   マイページ（日本語は `/mypage`、英語は `/en/mypage`）
 */
export async function redirectIfAuthenticated(to?: string): Promise<void> {
  const user = await getOptionalUser();
  if (user) {
    redirect(to ?? localizedHref("/mypage", await currentLocale()));
  }
}

/**
 * 認証ゲートが返すエラーコード
 *
 * 未認証が `"unauthorized"`、BAN が `"banned"`。
 * {@link authenticateAndCheckBan} の結果をそのまま返すアクションは、
 * `ActionResult` の union にこの型を含める。
 */
export type AuthGateErrorCode = "unauthorized" | "banned";

/**
 * 認証 + BAN チェックガード（Server Actions 用）。
 * 認証済みかつ BAN されていないユーザーを返す。
 * 認証+BANガード
 *
 * DB を書き換える Server Action はすべてこれを通すこと。ページガード
 * （{@link requireConfirmedUser} 等）は画面遷移しか守らないため、Action を
 * 直接叩かれると BAN が効かない。
 *
 * エラーコードは未認証が `"unauthorized"`、BAN が `"banned"`。退会を
 * 受け付けたユーザー（退会の工程が終わるまではログインが生きている）も
 * `"unauthorized"` にする — 消したデータを書き込みで蘇らせないため。
 * 入口のこの確認は早く断るためのもので、受付との競合は書き込みの
 * トランザクションの中（`lockAccountForWrite`）が閉じる。
 *
 * @param options.forAccountDeletion - 退会の受付として使う。BAN 中・退会処理中も
 *   通す（本人による退会は、通常の利用を止める BAN の対象にしない。受付は
 *   冪等なので処理中に送り直してもよい）
 */
export async function authenticateAndCheckBan(
  options: { readonly forAccountDeletion?: boolean } = {},
): Promise<{ user: AuthUser } | { error: AuthGateErrorCode }> {
  const user = await getOptionalVerifiedUser();

  if (!user) {
    return { error: "unauthorized" };
  }
  if (options.forAccountDeletion) {
    return { user };
  }

  const standing = await getAccountStanding(user.id);
  if (standing === "deleting") {
    return { error: "unauthorized" };
  }
  if (standing === "banned") {
    return { error: "banned" };
  }

  return { user };
}

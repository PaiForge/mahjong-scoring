import "server-only";

import type { NextResponse } from "next/server";
import { createClient, isAuthRetryableFetchError } from "@supabase/supabase-js";

import type { MobileApiErrorCode } from "@mahjong-scoring/features/account/mobile-api";

import type { AuthUser } from "../auth";
import { getClientIp } from "../client-ip";
import { getAccountStanding } from "../ban";
import { getProfileCoreByUserId } from "../db/queries";
import { getSupabasePublicEnv } from "../supabase/env";
import {
  IP_RATE_LIMITS,
  checkIpRateLimitGuard,
  type IpRateLimitConfig,
} from "../rate-limit-ip";

import { mobileJson } from "./response";

/**
 * アプリ向け API の認証で弾く理由（意味はアプリと共有する `MobileApiErrorCode` の TSDoc）
 */
export type MobileAuthErrorCode = Exclude<MobileApiErrorCode, "rateLimited">;

/** アプリ向け API の認証を通ったユーザーとプロフィールの状態 */
export interface MobileAuthContext {
  readonly user: AuthUser;
  /**
   * ユーザー名を決めたプロフィール。未作成（登録直後でユーザー名を
   * 決めていない）なら undefined。退会済みはここに来る前に弾く
   */
  readonly profile: { readonly username: string } | undefined;
  /**
   * このユーザーにつながった Apple の連携の Apple のユーザー ID（ID トークンの
   * sub）。Apple でログインしたことが無ければ undefined
   */
  readonly appleSubject: string | undefined;
}

/** 認証サーバーが認めたユーザー */
interface VerifiedUser {
  readonly user: AuthUser;
  readonly appleSubject: string | undefined;
}

/**
 * `Authorization: Bearer <token>` からアクセストークンを取り出す
 * Bearerトークン取得
 *
 * 形式が違えば undefined。スキーム名は大文字小文字を区別しない（RFC 9110）。
 */
export function readBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1];
}

/**
 * Bearer トークンを認証サーバーに問い合わせて検証する
 * Bearerトークン検証
 *
 * @design getClaims ではなく getUser で検証する
 *
 * JWT の署名と期限だけを見る `getClaims` では、ログアウト・アカウント削除・
 * BAN の後もトークンの期限（1 時間）まで書き込めてしまう。web の書き込み
 * （`authenticateAndCheckBan`）が `getUser` で失効を即座に反映しているのと
 * 強さを揃える。読み取り専用の API で往復を削りたくなっても、ここは共有の
 * 入口なので緩めない。
 *
 * cookie を読む `lib/supabase/server.ts` のクライアントは使わない。
 * セッションを持たないクライアントにトークンを直接渡す。
 */
async function verifyBearerToken(
  token: string,
): Promise<VerifiedUser | "invalid" | "unavailable"> {
  const { url, publishableKey } = getSupabasePublicEnv();
  const supabase = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (user) {
    const apple = user.identities?.find(
      (identity) => identity.provider === "apple",
    );
    return {
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata.provider,
      },
      appleSubject: apple?.id,
    };
  }
  return isAuthServiceFailure(error) ? "unavailable" : "invalid";
}

/**
 * 認証サーバーが答えられなかった（トークンの正否が分からない）失敗か
 *
 * 届かない（`AuthRetryableFetchError`・status 0）・回数制限（429）・
 * サーバーの障害（5xx）は、トークンが無効だという答えではない。これを
 * 401 にすると、アプリは有効なログインを捨ててしまう。それ以外（不正な
 * JWT の 403・ログアウト済みの `AuthSessionMissingError`・削除済み）は
 * 認証サーバーが「無効」と答えたもの（2026-10 にローカルで実測）。
 */
function isAuthServiceFailure(error: unknown): boolean {
  if (isAuthRetryableFetchError(error)) return true;
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;
  return (
    typeof status !== "number" ||
    status === 0 ||
    status === 429 ||
    status >= 500
  );
}

/**
 * アプリ向け API の認証（トークン検証 + アカウントの状態）
 * アプリAPI認証
 *
 * ユーザーの ID は検証済みトークンからだけ取る。リクエスト本文の
 * userId を信じる経路を作らない。
 *
 * 退会を受け付けたユーザーは、退会の工程が終わるまでログインが生きている。
 * その間の要求は `deleted` で弾く（401 ではない — トークンは有効で、
 * 「このアカウントは退会を受け付けた」という答え。アプリはこれを受けて
 * 退会を受け付けた旨を伝え、端末のログインを捨てる）。退会の工程は
 * サーバーが進めるので、本人に何かをやり直させる必要は無い。
 *
 * プロフィール未作成は弾かない — ユーザー名の設定や退会はその状態から
 * 呼ぶので、要否は各 API が `profile` を見て決める。
 *
 * @param options.forAccountDeletion - 退会の受付として使う。BAN 中・退会処理中も通す
 */
export async function authenticateMobileRequest(
  request: Request,
  {
    forAccountDeletion = false,
  }: { readonly forAccountDeletion?: boolean } = {},
): Promise<MobileAuthContext | { error: MobileAuthErrorCode }> {
  const token = readBearerToken(request);
  if (!token) return { error: "unauthorized" };

  const verified = await verifyBearerToken(token);
  if (verified === "invalid") return { error: "unauthorized" };
  if (verified === "unavailable") return { error: "authUnavailable" };
  const { user, appleSubject } = verified;

  const [profile, standing] = await Promise.all([
    getProfileCoreByUserId(user.id),
    getAccountStanding(user.id),
  ]);
  if (!forAccountDeletion) {
    if (standing === "deleting") return { error: "deleted" };
    if (standing === "banned") return { error: "banned" };
  }

  return {
    user,
    profile: profile ? { username: profile.username } : undefined,
    appleSubject,
  };
}

/** 認証で弾いた理由ごとの HTTP ステータス */
const MOBILE_AUTH_ERROR_STATUS = {
  unauthorized: 401,
  // トークンは有効で、アカウントが退会を受け付けた（401 にするとアプリの
  // 「古いトークンなら更新して送り直す」に回ってしまう）
  deleted: 403,
  banned: 403,
  // 再試行してよい失敗。アプリはログインを捨てない
  authUnavailable: 503,
} as const satisfies Record<MobileAuthErrorCode, number>;

type AuthorizeMobileResult =
  | ({ readonly ok: true } & MobileAuthContext)
  | { readonly ok: false; readonly response: NextResponse };

/**
 * アプリ向け Route Handler 共通の「レートリミット + 認証」前処理
 * アプリAPI認証前処理
 *
 * 超過は 429、未認証は 401、退会を受け付けた・BAN は 403、認証サーバーの障害は 503 の応答を
 * `{ ok: false, response }` で返す。
 *
 * @design Origin による CSRF 検証をしない
 *
 * 認証は `Authorization` ヘッダのトークンだけで、cookie を一切読まない
 * （フォールバックもしない）。ブラウザが勝手に添える資格情報に依存しない
 * ので、他サイトから被害者の権限で叩かせる CSRF が成立しない。web 向けの
 * `authorizeApiRequest`（`lib/api-auth.ts`）が Origin を見るのは cookie で
 * 認証するから。この 2 つを混ぜないこと — cookie を読み始めたら Origin 検証も要る。
 *
 * @design レートリミットは IP とユーザーの 2 段
 *
 * IP の枠は認証より前に数え、認証サーバーへの問い合わせ自体を絞る。
 * ユーザーの枠は認証の後に数え、回線を変えながら 1 アカウントで叩く経路を
 * 絞る。どちらも `rate-limit-ip.ts` のインメモリの枠を使うので、インスタンス
 * 間で共有されない制約も同じ（web の Server Action と同条件）。ユーザーの枠は
 * キーに `user:` を付けて IP の枠と混ざらないようにしている。
 *
 * @param rateLimitKey - レートリミットのアクションキー（`IP_RATE_LIMITS` のキー）
 * @param options.config - レートリミット設定（省略時は `IP_RATE_LIMITS[rateLimitKey]`）
 * @param options.forAccountDeletion - 退会の受付として使う（退会の API だけ）。
 *   BAN 中・退会処理中も通す（本人による退会は BAN の対象にしない。受付は冪等）
 */
export async function authorizeMobileRequest(
  request: Request,
  rateLimitKey: keyof typeof IP_RATE_LIMITS,
  options: {
    readonly config?: Readonly<IpRateLimitConfig>;
    readonly forAccountDeletion?: boolean;
  } = {},
): Promise<AuthorizeMobileResult> {
  const config = options.config ?? IP_RATE_LIMITS[rateLimitKey];
  const rateLimited = () => ({
    ok: false as const,
    response: mobileJson({ error: "rateLimited" }, { status: 429 }),
  });

  if (checkIpRateLimitGuard(await getClientIp(), rateLimitKey, config)) {
    return rateLimited();
  }

  const auth = await authenticateMobileRequest(request, options);
  if ("error" in auth) {
    return {
      ok: false,
      response: mobileJson(
        { error: auth.error },
        { status: MOBILE_AUTH_ERROR_STATUS[auth.error] },
      ),
    };
  }

  if (checkIpRateLimitGuard(`user:${auth.user.id}`, rateLimitKey, config)) {
    return rateLimited();
  }

  return { ok: true, ...auth };
}

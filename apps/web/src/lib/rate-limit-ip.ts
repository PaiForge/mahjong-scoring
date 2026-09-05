/**
 * IP ベースのインメモリレートリミッター。
 * Server Action（未認証エンドポイント）向けの固定ウィンドウ方式。
 * IPレートリミッター
 *
 * 制限事項:
 * - インメモリ（Map）ベースのため、マルチインスタンス環境ではインスタンス間で
 *   レートリミットの状態が共有されない。
 * - Serverless 環境（Vercel Functions 等）ではコールドスタートごとにストアが
 *   リセットされるため、制限の精度が低下する。
 * - Supabase サーバーサイドのレートリミットとの二重防御により、上記制限の
 *   影響を緩和している。
 *
 * TODO: 本番環境のスケール時には Redis（Upstash 等）ベースの実装に移行し、
 * インスタンス間で状態を共有できるようにする。
 */

export interface IpRateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * 期限切れの記録を捨てる。
 *
 * 時刻を引数で受けるのは、呼び出し元の判定と同じ瞬間を見るため。ここで
 * 時計を読み直すと、掃除と許可判定がミリ秒単位でずれた時刻を見ることになり、
 * ちょうど境界に当たった記録を「掃除では期限切れ、判定では有効」と
 * 食い違って扱いうる。
 */
function cleanup(now: number) {
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/** テスト用: ストアをリセットする */
export function _resetStore() {
  store.clear();
}

/**
 * 指定 IP・アクションの組み合わせがレートリミット内かを判定する。
 * IPレートリミットチェック
 *
 * @param ip - クライアント IP
 * @param action - アクションキー（例: `'signIn'`）
 * @param config - レートリミット設定
 * @param now - 判定に使う現在時刻（ミリ秒）。既定は `Date.now()`
 *
 * `now` を引数に出しているのは、ウィンドウの境界（`resetAt` ちょうど）で
 * 許可するか拒むかという、この関数の一番きわどい分岐をテストが直接
 * 指定できるようにするため。時計を関数の中だけで読んでいると、境界の検証に
 * タイマーの差し替えが要る上、掃除と判定で別々の時刻を見る余地が残る。
 */
export function checkIpRateLimit(
  ip: string,
  action: string,
  config: Readonly<IpRateLimitConfig>,
  now: number = Date.now(),
): { allowed: boolean } {
  cleanup(now);

  const key = `${ip}:${action}`;
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true };
  }

  return { allowed: false };
}

/** 各アクションのレートリミット設定 */
export const IP_RATE_LIMITS = {
  signIn: { maxRequests: 10, windowMs: 300_000 },
  signUp: { maxRequests: 5, windowMs: 300_000 },
  forgotPassword: { maxRequests: 3, windowMs: 300_000 },
  resendEmail: { maxRequests: 3, windowMs: 300_000 },
  resetPassword: { maxRequests: 5, windowMs: 300_000 },
  username: { maxRequests: 5, windowMs: 300_000 },
  deleteAccount: { maxRequests: 5, windowMs: 300_000 },
  uploadAvatar: { maxRequests: 5, windowMs: 600_000 },
  deleteAvatar: { maxRequests: 5, windowMs: 600_000 },
  updateProfile: { maxRequests: 10, windowMs: 600_000 },
  updateLeaderboardVisibility: { maxRequests: 20, windowMs: 600_000 },
} as const;

/**
 * Server Action 用の IP レートリミットガード。
 * 制限超過時は `{ error: 'rateLimited' }` を返し、許可時は undefined を返す。
 * IPレートリミットガード
 *
 * @param ip - クライアント IP（`getClientIp()` の戻り値）
 * @param key - アクションキー（例: `'signIn'`）
 * @param config - レートリミット設定
 */
/**
 * レートリミット超過を表すエラーコード
 *
 * これを返すアクションは `ActionResult` の union にこの型を含める。
 */
export type RateLimitErrorCode = "rateLimited";

export function checkIpRateLimitGuard(
  ip: string | undefined,
  key: string,
  config: Readonly<IpRateLimitConfig>,
): { error: RateLimitErrorCode } | undefined {
  const effectiveIp = ip ?? "unknown";
  const { allowed } = checkIpRateLimit(effectiveIp, key, config);
  if (!allowed) {
    return { error: "rateLimited" };
  }
  return undefined;
}

/**
 * Server Action 用の IP レートリミットラッパー。
 * `getClientIp()` の呼び出しとガード判定を一括で行い、
 * 制限超過時は `{ error: 'rateLimited' }` を返す。
 * IPレートリミット一括チェック
 *
 * @param key - アクションキー（`IP_RATE_LIMITS` のキー）
 * @param config - レートリミット設定（省略時は `IP_RATE_LIMITS[key]`）
 */
export async function enforceIpRateLimit(
  key: keyof typeof IP_RATE_LIMITS,
  config: Readonly<IpRateLimitConfig> = IP_RATE_LIMITS[key],
): Promise<{ error: RateLimitErrorCode } | undefined> {
  const { getClientIp } = await import("./client-ip");
  const ip = await getClientIp();
  return checkIpRateLimitGuard(ip, key, config);
}
